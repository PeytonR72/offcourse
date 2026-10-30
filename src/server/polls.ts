import type { Question } from "../domain/content";
import type { QuestionSnapshot } from "../domain/questions";

export type PollQuestion = Omit<Question, "status" | "distributionId"> & {
  sourceType: "first_party" | "licensed_external";
};

export type PollDatabase = {
  query<T extends Record<string, unknown>>(
    sql: string,
    values?: unknown[]
  ): Promise<{ rows: T[] }>;
};

export type VoteStatus =
  "accepted" | "invalid" | "duplicate" | "unavailable" | "rate_limited";

export type PollSource = Readonly<{
  yesVotes: number;
  sampleSize: number;
  attribution: string;
  citationUrl: string;
  permission: string;
  verification: string;
}>;

export type PublishedDaily = Readonly<{
  dateKey: string;
  version: number;
  publishedAt: string;
  questions: readonly QuestionSnapshot[];
}>;

/** Server-only operations; never pass this repository to a client component. */
export class PollRepository {
  private readonly db: PollDatabase;

  constructor(db: PollDatabase) {
    this.db = db;
  }

  async createQuestion(question: PollQuestion): Promise<void> {
    await this.db.query(
      `INSERT INTO offcourse_poll.questions
       (id, prompt, yes_label, no_label, category, source_type) VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        question.id,
        question.prompt,
        question.yesLabel,
        question.noLabel,
        question.category,
        question.sourceType,
      ]
    );
  }

  async review(
    id: string,
    decision: "approved" | "rejected",
    note: string
  ): Promise<void> {
    const result = await this.db.query(
      `UPDATE offcourse_poll.questions SET moderation=$2, review_note=$3, reviewed_at=now()
       WHERE id=$1 RETURNING id`,
      [id, decision, note]
    );
    if (!result.rows.length) throw new Error("Unknown poll");
  }

  async importSource(id: string, source: PollSource): Promise<void> {
    await this.db.query(
      "SELECT offcourse_poll.import_source($1,$2,$3,$4,$5,$6,$7)",
      [
        id,
        source.yesVotes,
        source.sampleSize,
        source.attribution,
        source.citationUrl,
        source.permission,
        source.verification,
      ]
    );
  }

  async vote(
    id: string,
    voterKey: string,
    answer: string,
    consent: string,
    at: Date
  ): Promise<VoteStatus> {
    const result = await this.db.query<{ status: VoteStatus }>(
      "SELECT offcourse_poll.submit_vote($1,$2,$3,$4,$5) AS status",
      [id, voterKey, answer, consent, at.toISOString()]
    );
    return result.rows[0].status;
  }

  async publish(id: string): Promise<QuestionSnapshot> {
    const result = await this.db.query<{ snapshot: QuestionSnapshot }>(
      "SELECT offcourse_poll.publish_snapshot($1) AS snapshot",
      [id]
    );
    return result.rows[0].snapshot;
  }

  async snapshot(id: string): Promise<QuestionSnapshot | null> {
    const result = await this.db.query<{ snapshot: QuestionSnapshot | null }>(
      "SELECT offcourse_poll.snapshot_json($1) AS snapshot",
      [id]
    );
    return result.rows[0].snapshot;
  }

  async publishDaily(
    dateKey: string,
    ids: readonly string[]
  ): Promise<PublishedDaily> {
    requireDateKey(dateKey);
    const result = await this.db.query<{ manifest: PublishedDaily }>(
      "SELECT offcourse_poll.publish_daily($1,$2) AS manifest",
      [dateKey, [...ids]]
    );
    return result.rows[0].manifest;
  }

  async daily(dateKey: string): Promise<PublishedDaily | null> {
    requireDateKey(dateKey);
    const result = await this.db.query<{ manifest: PublishedDaily | null }>(
      "SELECT offcourse_poll.daily_json($1) AS manifest",
      [dateKey]
    );
    return result.rows[0].manifest;
  }
}

function requireDateKey(value: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("UTC date key must use YYYY-MM-DD");
  }
}
