import { createHash } from "node:crypto";

/** The caller supplies one dedicated connection for the entire migration. */
export async function migratePolls(database, migrations) {
  await database.query("BEGIN");
  try {
    await database.query("SELECT pg_advisory_xact_lock(1734481251)");
    await database.query(`CREATE TABLE IF NOT EXISTS public.offcourse_poll_migrations (
      name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now()
    )`);
    const applied = [];
    for (const { name, sql } of migrations) {
      const checksum = createHash("sha256").update(sql).digest("hex");
      const previous = await database.query(
        "SELECT checksum FROM public.offcourse_poll_migrations WHERE name=$1",
        [name]
      );
      if (previous.rows.length) {
        if (previous.rows[0].checksum !== checksum)
          throw new Error(`Previously applied migration changed: ${name}`);
        continue;
      }
      await database.exec(sql);
      await database.query(
        "INSERT INTO public.offcourse_poll_migrations (name,checksum) VALUES ($1,$2)",
        [name, checksum]
      );
      applied.push(name);
    }
    await database.query("COMMIT");
    return applied;
  } catch (error) {
    await database.query("ROLLBACK");
    throw error;
  }
}
