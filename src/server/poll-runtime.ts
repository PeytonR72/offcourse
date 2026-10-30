import "server-only";
import { Pool } from "pg";
import { PollRepository } from "./polls";

let pool: Pool | undefined;

export function getPollIntake() {
  const { POLL_DATABASE_URL, POLL_VOTE_SECRET, POLL_INTAKE_ENABLED } =
    process.env;
  if (
    POLL_INTAKE_ENABLED !== "true" ||
    !POLL_DATABASE_URL ||
    !POLL_VOTE_SECRET ||
    POLL_VOTE_SECRET.length < 32
  )
    return null;
  pool ??= new Pool({
    connectionString: POLL_DATABASE_URL,
    max: 3,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10_000,
    statement_timeout: 5000,
  });
  // Idle connection errors must not terminate the server or print credentials.
  if (pool.listenerCount("error") === 0)
    pool.on("error", () =>
      console.error("Poll database connection unavailable")
    );
  return {
    repository: new PollRepository(pool),
    secret: POLL_VOTE_SECRET,
    clock: () => new Date(),
  };
}
