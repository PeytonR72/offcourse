-- Serialize all editorial calendar writes, including single-day publication.
ALTER TABLE offcourse_poll.questions
  ADD COLUMN retired_at timestamptz,
  ADD COLUMN retirement_reason text,
  ADD CONSTRAINT retirement_review CHECK (
    (retired_at IS NULL AND retirement_reason IS NULL) OR
    (retired_at IS NOT NULL AND retirement_reason IS NOT NULL
      AND length(trim(retirement_reason))>0 AND moderation='rejected')
  );

-- Legacy results conservatively enter the cooldown at migration time.
ALTER TABLE offcourse_poll.play_results ADD COLUMN locked_at timestamptz NOT NULL DEFAULT now();
CREATE INDEX play_results_recent ON offcourse_poll.play_results(locked_at,run_id);

CREATE VIEW offcourse_poll.eligible_snapshots AS
  SELECT s.* FROM offcourse_poll.snapshots s
  JOIN offcourse_poll.questions q ON q.id=s.question_id
  WHERE q.moderation='approved' AND q.retired_at IS NULL
    AND s.sample_size>=100 AND s.source_type IN ('first_party','licensed_external');

-- Counts questions, not versions. Existing manifests keep their frozen versions.
CREATE FUNCTION offcourse_poll.content_coverage(p_date date) RETURNS jsonb LANGUAGE sql STABLE AS $$
  WITH coverage AS (
    SELECT
      (SELECT count(*)::integer FROM offcourse_poll.daily_manifests m
       WHERE m.date_key BETWEEN p_date AND p_date+6 AND
         (SELECT count(DISTINCT s.question_id) FROM offcourse_poll.eligible_snapshots s
          WHERE s.id=ANY(m.snapshot_ids))=5) AS days,
      (SELECT count(DISTINCT question_id)::integer FROM offcourse_poll.eligible_snapshots) AS pool,
      NOT EXISTS (
        SELECT 1 FROM offcourse_poll.daily_manifests a
        JOIN offcourse_poll.daily_manifests b ON b.date_key>a.date_key AND b.date_key<a.date_key+7
        JOIN offcourse_poll.snapshots old ON old.id=ANY(a.snapshot_ids)
        JOIN offcourse_poll.snapshots upcoming ON upcoming.question_id=old.question_id AND upcoming.id=ANY(b.snapshot_ids)
        WHERE a.date_key>=p_date-6 AND b.date_key BETWEEN p_date AND p_date+6
      ) AS no_repeats
  ) SELECT jsonb_build_object('dailyDays',days,'endlessQuestions',pool,
      'ready',days=7 AND pool>=100 AND no_repeats)
    FROM coverage;
$$;

ALTER FUNCTION offcourse_poll.publish_daily(date, text[]) RENAME TO publish_daily_unchecked;
CREATE FUNCTION offcourse_poll.publish_daily(p_date date, p_ids text[]) RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  published jsonb;
BEGIN
  PERFORM pg_advisory_xact_lock(1734481252);
  -- The original publisher validates and locks the questions before these checks.
  published := offcourse_poll.publish_daily_unchecked(p_date, p_ids);
  IF EXISTS (
    SELECT 1 FROM offcourse_poll.daily_manifests m
    CROSS JOIN LATERAL unnest(m.snapshot_ids) prior(id)
    JOIN offcourse_poll.snapshots old ON old.id=prior.id
    JOIN offcourse_poll.snapshots upcoming ON upcoming.question_id=old.question_id
    WHERE upcoming.id=ANY(p_ids) AND m.date_key<>p_date
      AND abs(m.date_key-p_date)<7
  ) THEN RAISE EXCEPTION 'A recent daily question cannot repeat within seven UTC dates'; END IF;
  RETURN published;
END;
$$;

CREATE FUNCTION offcourse_poll.publish_week(p_start date, p_days jsonb) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  day_index integer;
  ids text[];
BEGIN
  IF p_start IS NULL OR p_days IS NULL OR jsonb_typeof(p_days)<>'array'
     OR jsonb_array_length(p_days)<>7 THEN
    RAISE EXCEPTION 'Exactly seven ordered days are required';
  END IF;
  PERFORM pg_advisory_xact_lock(1734481252);
  FOR day_index IN 0..6 LOOP
    SELECT array_agg(value ORDER BY position) INTO ids
      FROM jsonb_array_elements_text(p_days->day_index) WITH ORDINALITY AS day(value,position);
    PERFORM offcourse_poll.publish_daily(p_start+day_index, ids);
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION offcourse_poll.publish_daily(date,text[]),
  offcourse_poll.publish_week(date,jsonb), offcourse_poll.content_coverage(date) FROM PUBLIC;
