// @vitest-environment node
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { expect, test } from "vitest";
import { migratePolls } from "../../scripts/poll-migrations.mjs";
import { PollRepository } from "./polls";

test("migrations apply once, detect edits, and roll back failed changes", async () => {
  const db = new PGlite();
  try {
    const migration = {
      name: "001-polls.sql",
      sql: await readFile("db/migrations/001-polls.sql", "utf8"),
    };
    expect(await migratePolls(db, [migration])).toEqual(["001-polls.sql"]);
    const polls = new PollRepository(db);
    await polls.createQuestion({
      id: "retained",
      prompt: "A test?",
      yesLabel: "Yes",
      noLabel: "No",
      category: "test",
      sourceType: "first_party",
    });
    expect(await migratePolls(db, [migration])).toEqual([]);
    await polls.review(
      "retained",
      "approved",
      "Retained after migration rerun"
    );
    await expect(
      migratePolls(db, [{ ...migration, sql: migration.sql + "\n-- edited" }])
    ).rejects.toThrow(/changed/);
    const bad = {
      name: "002-failure.sql",
      sql: "CREATE TABLE offcourse_poll.rollback_probe(id integer); SELECT 1/0;",
    };
    await expect(migratePolls(db, [bad])).rejects.toThrow();
    expect(
      await migratePolls(db, [
        {
          ...bad,
          sql: "CREATE TABLE offcourse_poll.rollback_probe(id integer);",
        },
      ])
    ).toEqual(["002-failure.sql"]);
  } finally {
    await db.close();
  }
}, 30_000);
