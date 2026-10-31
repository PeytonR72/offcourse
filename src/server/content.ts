import type { PollDatabase } from "./polls";

export type ContentCoverage = Readonly<{
  ready: boolean;
  dailyDays: number;
  endlessQuestions: number;
}>;

export type QuestionQuality = Readonly<{
  questionId: string;
  moderation: string;
  retiredAt: string | null;
  retirementReason: string | null;
  sampleSize: number | null;
  attempts: number;
  meanError: number | null;
  missPercentage: number | null;
}>;

/** Trusted editorial operations; results may contain private poll information. */
export class ContentRepository {
  private readonly db: PollDatabase;

  constructor(db: PollDatabase) {
    this.db = db;
  }

  async publishWeek(startDate: string, days: readonly (readonly string[])[]) {
    requireDateKey(startDate);
    await this.db.query("SELECT offcourse_poll.publish_week($1,$2)", [
      startDate,
      JSON.stringify(days),
    ]);
  }

  async coverage(dateKey: string): Promise<ContentCoverage> {
    requireDateKey(dateKey);
    const result = await this.db.query<{ coverage: ContentCoverage }>(
      "SELECT offcourse_poll.content_coverage($1) AS coverage",
      [dateKey]
    );
    return result.rows[0].coverage;
  }

  async retire(id: string, reason: string, at: Date): Promise<void> {
    const result = await this.db.query(
      `UPDATE offcourse_poll.questions SET retired_at=$3, retirement_reason=$2,
       moderation='rejected', review_note=$2, reviewed_at=$3
       WHERE id=$1 AND retired_at IS NULL RETURNING id`,
      [id, reason, at.toISOString()]
    );
    if (!result.rows.length)
      throw new Error("Unknown or already retired question");
  }

  async quality(): Promise<readonly QuestionQuality[]> {
    const result = await this.db.query<QuestionQuality>(
      `SELECT q.id AS "questionId", q.moderation,
       q.retired_at AS "retiredAt", q.retirement_reason AS "retirementReason",
       (SELECT sample_size FROM offcourse_poll.snapshots s WHERE s.question_id=q.id
        ORDER BY version DESC LIMIT 1) AS "sampleSize",
       count(r.*)::integer AS attempts,
       avg((r.result->'score'->>'error')::double precision) AS "meanError",
       100.0 * count(r.*) FILTER (WHERE (r.result->'score'->>'survived')::boolean=false)
         / nullif(count(r.*),0) AS "missPercentage"
       FROM offcourse_poll.questions q LEFT JOIN offcourse_poll.play_results r
         ON r.result->'lock'->'question'->>'id'=q.id
       GROUP BY q.id ORDER BY q.id`
    );
    return result.rows.map((row) => ({
      ...row,
      retiredAt:
        row.retiredAt === null ? null : new Date(row.retiredAt).toISOString(),
      missPercentage:
        row.missPercentage === null ? null : Number(row.missPercentage),
    }));
  }
}

function requireDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new Error("UTC date key must use YYYY-MM-DD");
}
