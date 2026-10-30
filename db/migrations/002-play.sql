CREATE TABLE offcourse_poll.play_runs (
  id uuid PRIMARY KEY,
  participant text NOT NULL CHECK (participant ~ '^[0-9a-f]{64}$'),
  mode text NOT NULL CHECK (mode IN ('daily', 'endless')),
  date_key date NOT NULL,
  snapshot_ids text[] NOT NULL CHECK (cardinality(snapshot_ids) > 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'complete', 'lost', 'exhausted')),
  total_distance integer NOT NULL DEFAULT 0 CHECK (total_distance >= 0),
  streak integer NOT NULL DEFAULT 0 CHECK (streak >= 0),
  created_at timestamptz NOT NULL
);
CREATE UNIQUE INDEX one_daily_participation ON offcourse_poll.play_runs(participant, date_key) WHERE mode = 'daily';
CREATE INDEX play_participant ON offcourse_poll.play_runs(participant);

CREATE TABLE offcourse_poll.play_results (
  run_id uuid NOT NULL REFERENCES offcourse_poll.play_runs(id),
  round_index integer NOT NULL CHECK (round_index >= 0),
  result jsonb NOT NULL,
  PRIMARY KEY (run_id, round_index)
);
CREATE TRIGGER immutable_play_result BEFORE UPDATE OR DELETE OR TRUNCATE ON offcourse_poll.play_results
  FOR EACH STATEMENT EXECUTE FUNCTION offcourse_poll.reject_mutation();

CREATE TABLE offcourse_poll.play_limits (
  participant text PRIMARY KEY,
  window_start timestamptz NOT NULL,
  attempts integer NOT NULL
);
