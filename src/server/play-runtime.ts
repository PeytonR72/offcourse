import "server-only";
import { Pool } from "pg";
import { PlayRepository, type PlayDatabase } from "./play";
import { ContentRepository } from "./content";

let database: PlayDatabase | undefined;

export function playEnabled(): boolean {
  return (
    process.env.PLAY_ENABLED === "true" &&
    !!process.env.PLAY_DATABASE_URL &&
    (process.env.PLAY_SECRET?.length ?? 0) >= 32
  );
}

export function getPlayRuntime() {
  if (!playEnabled()) return null;
  if (!database) {
    const pool = new Pool({
      connectionString: process.env.PLAY_DATABASE_URL,
      max: 3,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10_000,
      statement_timeout: 5000,
    });
    pool.on("error", () =>
      console.error("Play database connection unavailable")
    );
    database = {
      async transaction(work) {
        const client = await pool.connect();
        let damaged = false;
        try {
          await client.query("BEGIN");
          const result = await work(client);
          await client.query("COMMIT");
          return result;
        } catch (error) {
          try {
            await client.query("ROLLBACK");
          } catch {
            damaged = true;
          }
          throw error;
        } finally {
          client.release(damaged);
        }
      },
    };
  }
  return {
    checkContent: () =>
      database!.transaction(
        async (db) =>
          (
            await new ContentRepository(db).coverage(
              new Date().toISOString().slice(0, 10)
            )
          ).ready
      ),
    repository: new PlayRepository(database),
    secret: process.env.PLAY_SECRET!,
    clock: () => new Date(),
  };
}
