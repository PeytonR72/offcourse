CREATE SCHEMA offcourse_poll;
REVOKE ALL ON SCHEMA offcourse_poll FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA offcourse_poll REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

CREATE TABLE offcourse_poll.questions (
  id text PRIMARY KEY CHECK (id ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  prompt text NOT NULL CHECK (length(trim(prompt)) BETWEEN 1 AND 500),
  yes_label text NOT NULL CHECK (length(trim(yes_label)) BETWEEN 1 AND 80),
  no_label text NOT NULL CHECK (length(trim(no_label)) BETWEEN 1 AND 80),
  category text NOT NULL CHECK (length(trim(category)) BETWEEN 1 AND 80),
  source_type text NOT NULL CHECK (source_type IN ('first_party', 'licensed_external')),
  moderation text NOT NULL DEFAULT 'pending' CHECK (moderation IN ('pending', 'approved', 'rejected')),
  review_note text NOT NULL DEFAULT '',
  reviewed_at timestamptz,
  CHECK (moderation = 'pending' OR (length(trim(review_note)) > 0 AND reviewed_at IS NOT NULL))
);

CREATE TABLE offcourse_poll.votes (
  question_id text NOT NULL REFERENCES offcourse_poll.questions(id),
  voter_key text NOT NULL CHECK (voter_key ~ '^[0-9a-f]{64}$'),
  answer text NOT NULL CHECK (answer IN ('YES', 'NO')),
  consent_version text NOT NULL CHECK (consent_version = 'poll-v1'),
  accepted_at timestamptz NOT NULL,
  PRIMARY KEY (question_id, voter_key)
);

-- Shared across instances; pseudonymous installations are a best-effort limit.
CREATE TABLE offcourse_poll.vote_limits (
  voter_key text PRIMARY KEY,
  window_start timestamptz NOT NULL,
  attempts integer NOT NULL
);

CREATE FUNCTION offcourse_poll.submit_vote(
  p_question text, p_voter text, p_answer text, p_consent text, p_at timestamptz
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, offcourse_poll AS $$
DECLARE
  attempts_used integer;
  poll offcourse_poll.questions;
BEGIN
  IF p_voter IS NULL OR p_voter !~ '^[0-9a-f]{64}$'
     OR p_answer IS NULL OR p_answer NOT IN ('YES', 'NO')
     OR p_consent IS DISTINCT FROM 'poll-v1' OR p_at IS NULL THEN
    RETURN 'invalid';
  END IF;
  INSERT INTO offcourse_poll.vote_limits VALUES (p_voter, p_at, 1)
  ON CONFLICT (voter_key) DO UPDATE SET
    attempts = CASE WHEN p_at >= vote_limits.window_start + interval '1 minute'
      THEN 1 ELSE least(vote_limits.attempts + 1, 11) END,
    window_start = CASE WHEN p_at >= vote_limits.window_start + interval '1 minute'
      THEN p_at ELSE vote_limits.window_start END
  RETURNING attempts INTO attempts_used;
  IF attempts_used > 10 THEN RETURN 'rate_limited'; END IF;

  SELECT * INTO poll FROM offcourse_poll.questions WHERE id = p_question FOR UPDATE;
  IF NOT FOUND OR poll.source_type <> 'first_party' OR poll.moderation <> 'approved' THEN
    RETURN 'unavailable';
  END IF;
  INSERT INTO offcourse_poll.votes VALUES (p_question, p_voter, p_answer, p_consent, p_at)
  ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN RETURN 'duplicate'; END IF;
  RETURN 'accepted';
END;
$$;

CREATE TABLE offcourse_poll.snapshots (
  id text PRIMARY KEY,
  question_id text NOT NULL REFERENCES offcourse_poll.questions(id),
  version integer NOT NULL CHECK (version > 0),
  question jsonb NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('first_party', 'licensed_external')),
  yes_votes integer NOT NULL CHECK (yes_votes >= 0 AND yes_votes <= sample_size),
  sample_size integer NOT NULL CHECK (sample_size >= 100),
  yes_percentage double precision GENERATED ALWAYS AS (100.0 * yes_votes / sample_size) STORED,
  source_attribution text NOT NULL CHECK (length(trim(source_attribution)) > 0),
  frozen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (question_id, version)
);

CREATE FUNCTION offcourse_poll.reject_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Published content is immutable';
END;
$$;
CREATE TRIGGER immutable_snapshot BEFORE UPDATE OR DELETE OR TRUNCATE ON offcourse_poll.snapshots
  FOR EACH STATEMENT EXECUTE FUNCTION offcourse_poll.reject_mutation();

CREATE FUNCTION offcourse_poll.snapshot_json(p_id text) RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object('question', question, 'distribution', jsonb_build_object(
    'id', id, 'questionId', question_id, 'version', version,
    'yesPercentage', yes_percentage, 'sampleSize', sample_size,
    'sourceAttribution', source_attribution, 'frozenAt', frozen_at,
    'eligibilityStatus', 'eligible'
  )) FROM offcourse_poll.snapshots WHERE id = p_id;
$$;

CREATE TABLE offcourse_poll.sources (
  question_id text PRIMARY KEY REFERENCES offcourse_poll.questions(id),
  yes_votes integer NOT NULL CHECK (yes_votes >= 0 AND yes_votes <= sample_size),
  sample_size integer NOT NULL CHECK (sample_size > 0),
  attribution text NOT NULL CHECK (length(trim(attribution)) BETWEEN 1 AND 1000),
  citation_url text NOT NULL CHECK (citation_url ~ '^https://[^[:space:]]+$'),
  permission text NOT NULL CHECK (length(trim(permission)) BETWEEN 1 AND 2000),
  verification text NOT NULL CHECK (length(trim(verification)) BETWEEN 1 AND 2000)
);

CREATE FUNCTION offcourse_poll.import_source(
  p_question text, p_yes integer, p_total integer, p_attribution text,
  p_url text, p_permission text, p_verification text
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  -- Replacing evidence invalidates any prior approval, in the same transaction.
  UPDATE offcourse_poll.questions SET moderation = 'pending', review_note = '', reviewed_at = NULL
    WHERE id = p_question AND source_type = 'licensed_external';
  IF NOT FOUND THEN RAISE EXCEPTION 'A licensed external question is required'; END IF;
  INSERT INTO offcourse_poll.sources VALUES (p_question, p_yes, p_total, p_attribution, p_url, p_permission, p_verification)
  ON CONFLICT (question_id) DO UPDATE SET yes_votes = p_yes, sample_size = p_total,
    attribution = p_attribution, citation_url = p_url, permission = p_permission, verification = p_verification;
END;
$$;

CREATE FUNCTION offcourse_poll.publish_snapshot(p_question text) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  poll offcourse_poll.questions;
  total integer;
  yes_count integer;
  next_version integer;
  snapshot_id text;
  attribution text;
BEGIN
  SELECT * INTO poll FROM offcourse_poll.questions WHERE id = p_question FOR UPDATE;
  IF NOT FOUND OR poll.moderation <> 'approved' THEN
    RAISE EXCEPTION 'An approved editorial review is required';
  END IF;
  IF poll.source_type = 'first_party' THEN
    SELECT count(*), count(*) FILTER (WHERE answer = 'YES') INTO total, yes_count
      FROM offcourse_poll.votes WHERE question_id = p_question;
    attribution := 'Offcourse anonymous consented poll (poll-v1)';
  ELSE
    SELECT sample_size, yes_votes, sources.attribution || ' — ' || citation_url
      INTO total, yes_count, attribution FROM offcourse_poll.sources WHERE question_id = p_question;
    IF NOT FOUND THEN RAISE EXCEPTION 'Verified source counts are required'; END IF;
  END IF;
  IF total < 100 THEN RAISE EXCEPTION 'At least 100 qualified independent votes are required'; END IF;
  SELECT coalesce(max(version), 0) + 1 INTO next_version FROM offcourse_poll.snapshots WHERE question_id = p_question;
  snapshot_id := p_question || ':v' || next_version;
  INSERT INTO offcourse_poll.snapshots (id, question_id, version, question, source_type, yes_votes, sample_size, source_attribution)
  VALUES (snapshot_id, p_question, next_version, jsonb_build_object(
    'id', poll.id, 'prompt', poll.prompt, 'yesLabel', poll.yes_label, 'noLabel', poll.no_label,
    'category', poll.category, 'status', 'published', 'sourceType', poll.source_type, 'distributionId', snapshot_id
  ), poll.source_type, yes_count, total, attribution);
  RETURN offcourse_poll.snapshot_json(snapshot_id);
END;
$$;

CREATE TABLE offcourse_poll.daily_manifests (
  date_key date PRIMARY KEY,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  snapshot_ids text[] NOT NULL CHECK (cardinality(snapshot_ids) = 5),
  published_at timestamptz NOT NULL DEFAULT now()
);

CREATE FUNCTION offcourse_poll.daily_json(p_date date) RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT jsonb_build_object('dateKey', date_key::text, 'version', version, 'publishedAt', published_at,
    'questions', (SELECT jsonb_agg(offcourse_poll.snapshot_json(id) ORDER BY position)
       FROM unnest(snapshot_ids) WITH ORDINALITY AS selected(id, position)))
  FROM offcourse_poll.daily_manifests WHERE date_key = p_date;
$$;

CREATE FUNCTION offcourse_poll.publish_daily(p_date date, p_ids text[]) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  valid_count integer;
  poll_id text;
BEGIN
  IF p_ids IS NULL OR cardinality(p_ids) <> 5 THEN RAISE EXCEPTION 'Exactly five snapshots are required'; END IF;
  IF (SELECT count(DISTINCT id) FROM unnest(p_ids) AS id) <> 5 THEN
    RAISE EXCEPTION 'Five different questions are required';
  END IF;
  -- Lock questions in a stable order so approval cannot change mid-publication.
  FOR poll_id IN SELECT question_id FROM offcourse_poll.snapshots WHERE id = ANY(p_ids) ORDER BY question_id LOOP
    PERFORM id FROM offcourse_poll.questions WHERE id = poll_id FOR UPDATE;
  END LOOP;
  SELECT count(DISTINCT s.question_id) INTO valid_count FROM offcourse_poll.snapshots s
    JOIN offcourse_poll.questions q ON q.id = s.question_id
    WHERE s.id = ANY(p_ids) AND q.moderation = 'approved';
  IF valid_count <> 5 THEN RAISE EXCEPTION 'Five different approved qualified questions are required'; END IF;
  INSERT INTO offcourse_poll.daily_manifests (date_key, snapshot_ids) VALUES (p_date, p_ids);
  RETURN offcourse_poll.daily_json(p_date);
END;
$$;

CREATE TRIGGER immutable_daily BEFORE UPDATE OR DELETE OR TRUNCATE ON offcourse_poll.daily_manifests FOR EACH STATEMENT EXECUTE FUNCTION offcourse_poll.reject_mutation();

-- Schema-scoped defaults cannot subtract PostgreSQL's global function default.
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA offcourse_poll FROM PUBLIC;
