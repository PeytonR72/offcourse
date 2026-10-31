import type {
  PlayManifest,
  PlayPrediction,
  PlayReply,
} from "../domain/server-play";
import { scoreRound, type RunMode } from "../domain/scoring";
import type { QuestionSnapshot } from "../domain/questions";
import type { ResolvedRound } from "../domain/run";
import { randomUUID } from "node:crypto";
import type { PollDatabase } from "./polls";
import { ContentRepository } from "./content";

export type PlayDatabase = {
  transaction<T>(work: (db: PollDatabase) => Promise<T>): Promise<T>;
};

type StoredRun = {
  id: string;
  mode: RunMode;
  date_key: string;
  snapshot_ids: string[];
  status: PlayManifest["status"];
  total_distance: number;
  streak: number;
};

export class PlayRepository {
  constructor(
    private readonly database: PlayDatabase,
    private readonly createId: () => string = randomUUID
  ) {}

  async start(
    participant: string,
    requestId: string,
    mode: RunMode,
    at: Date
  ): Promise<PlayReply> {
    return this.database.transaction(async (db) => {
      if (!(await allowRequest(db, participant, at)))
        return { status: "rate_limited" };
      const dateKey = at.toISOString().slice(0, 10);
      const existing = await db.query<StoredRun>(
        `SELECT *, date_key::text FROM offcourse_poll.play_runs
         WHERE participant=$1 AND mode=$3 AND
           (($3='endless' AND id=$2) OR ($3='daily' AND date_key=$4::date)) FOR UPDATE`,
        [participant, requestId, mode, dateKey]
      );
      if (existing.rows.length) {
        return { status: "ok", play: await manifest(db, existing.rows[0]) };
      }
      if (!(await new ContentRepository(db).coverage(dateKey)).ready)
        return { status: "not_ready" };
      let ids: string[];
      if (mode === "daily") {
        const daily = await db.query<{ snapshot_ids: string[] }>(
          "SELECT snapshot_ids FROM offcourse_poll.daily_manifests WHERE date_key=$1::date",
          [dateKey]
        );
        ids = daily.rows[0]?.snapshot_ids ?? [];
      } else {
        const pool = await db.query<{ id: string }>(
          `SELECT DISTINCT ON (s.question_id) s.id FROM offcourse_poll.eligible_snapshots s
           WHERE NOT EXISTS (
             SELECT 1 FROM offcourse_poll.play_results r
             JOIN offcourse_poll.play_runs p ON p.id=r.run_id
             WHERE p.participant=$1 AND r.locked_at > $2::timestamptz - interval '168 hours'
               AND r.result->'lock'->'question'->>'id'=s.question_id
           ) ORDER BY s.question_id, s.version DESC`,
          [participant, at.toISOString()]
        );
        ids = pool.rows.map(({ id }) => id);
      }
      if (!ids.length)
        return { status: mode === "endless" ? "exhausted" : "not_ready" };
      // A browser can keep its request id across midnight. Daily identity is the
      // server UTC date, while an interrupted old run remains lockable by its id.
      const prior = await db.query<{
        participant: string;
        mode: RunMode;
        date_key: string;
      }>(
        "SELECT participant,mode,date_key::text FROM offcourse_poll.play_runs WHERE id=$1",
        [requestId]
      );
      let id = requestId;
      if (prior.rows.length) {
        const previous = prior.rows[0];
        if (
          mode !== "daily" ||
          previous.mode !== "daily" ||
          previous.participant !== participant ||
          previous.date_key === dateKey
        )
          return { status: "conflict" };
        id = this.createId();
      }
      const inserted = await db.query<StoredRun>(
        `INSERT INTO offcourse_poll.play_runs(id,participant,mode,date_key,snapshot_ids,created_at)
         VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING RETURNING *, date_key::text`,
        [id, participant, mode, dateKey, ids, at.toISOString()]
      );
      if (!inserted.rows.length) return { status: "conflict" };
      return { status: "ok", play: await manifest(db, inserted.rows[0]) };
    });
  }

  async lock(
    participant: string,
    runId: string,
    prediction: PlayPrediction,
    at: Date
  ): Promise<PlayReply> {
    return this.database.transaction(async (db) => {
      if (!(await allowRequest(db, participant, at)))
        return { status: "rate_limited" };
      const selected = await db.query<StoredRun>(
        "SELECT *, date_key::text FROM offcourse_poll.play_runs WHERE id=$1 AND participant=$2 FOR UPDATE",
        [runId, participant]
      );
      const run = selected.rows[0];
      if (!run) return { status: "unavailable" };
      const play = await manifest(db, run);
      const previous = play.results[prediction.roundIndex];
      if (previous) {
        if (
          previous.lock.answer !== prediction.answer ||
          previous.lock.guessPercentage !== prediction.guessPercentage
        )
          return { status: "conflict", play };
        return { status: "ok", play };
      }
      if (
        run.status !== "active" ||
        prediction.roundIndex !== play.results.length
      )
        return { status: "conflict" };
      const target = await db.query<{ snapshot: QuestionSnapshot }>(
        "SELECT offcourse_poll.snapshot_json($1) AS snapshot",
        [run.snapshot_ids[prediction.roundIndex]]
      );
      const { question, distribution } = target.rows[0].snapshot;
      const result: ResolvedRound = {
        lock: {
          roundId: `${run.id}:${prediction.roundIndex}`,
          question,
          distributionVersion: distribution.version,
          answer: prediction.answer,
          guessPercentage: prediction.guessPercentage,
        },
        distribution,
        score: scoreRound(
          run.mode,
          prediction.guessPercentage,
          distribution.yesPercentage
        ),
      };
      await db.query(
        "INSERT INTO offcourse_poll.play_results (run_id,round_index,result,locked_at) VALUES ($1,$2,$3,$4)",
        [
          run.id,
          prediction.roundIndex,
          JSON.stringify(result),
          at.toISOString(),
        ]
      );
      const finished = prediction.roundIndex + 1 === run.snapshot_ids.length;
      const status =
        run.mode === "endless" && !result.score.survived
          ? "lost"
          : finished
            ? run.mode === "daily"
              ? "complete"
              : "exhausted"
            : "active";
      await db.query(
        `UPDATE offcourse_poll.play_runs SET total_distance=total_distance+$2,
         streak=streak+$3, status=$4 WHERE id=$1`,
        [run.id, result.score.distance, result.score.survived ? 1 : 0, status]
      );
      return {
        status: "ok",
        play: {
          ...play,
          results: [...play.results, result],
          status,
          totalDistance: play.totalDistance + result.score.distance,
          streak: play.streak + (result.score.survived ? 1 : 0),
        },
      };
    });
  }
}

/** The upsert also serializes requests from one installation across instances. */
async function allowRequest(
  db: PollDatabase,
  participant: string,
  at: Date
): Promise<boolean> {
  const limit = await db.query<{ attempts: number }>(
    `INSERT INTO offcourse_poll.play_limits VALUES ($1,$2,1)
     ON CONFLICT (participant) DO UPDATE SET
       attempts=CASE WHEN $2::timestamptz >= play_limits.window_start + interval '1 minute'
         THEN 1 ELSE least(play_limits.attempts+1,31) END,
       window_start=CASE WHEN $2::timestamptz >= play_limits.window_start + interval '1 minute'
         THEN $2::timestamptz ELSE play_limits.window_start END RETURNING attempts`,
    [participant, at.toISOString()]
  );
  return limit.rows[0].attempts <= 30;
}

async function manifest(
  db: PollDatabase,
  run: StoredRun
): Promise<PlayManifest> {
  const questions = await db.query<{
    question: PlayManifest["questions"][number]["question"];
    distributionVersion: number;
  }>(
    `SELECT s.question, s.version AS "distributionVersion" FROM unnest($1::text[]) WITH ORDINALITY AS selected(id,position)
     JOIN offcourse_poll.snapshots s ON s.id=selected.id ORDER BY position`,
    [run.snapshot_ids]
  );
  const results = await db.query<{ result: PlayManifest["results"][number] }>(
    "SELECT result FROM offcourse_poll.play_results WHERE run_id=$1 ORDER BY round_index",
    [run.id]
  );
  return {
    id: run.id,
    mode: run.mode,
    dateKey: run.date_key,
    questions: questions.rows,
    results: results.rows.map(({ result }) => result),
    status: run.status,
    totalDistance: run.total_distance,
    streak: run.streak,
  };
}
