import { readFile, readdir } from "node:fs/promises";
import { Pool } from "pg";
import { PollRepository } from "../src/server/polls.ts";
import { ContentRepository } from "../src/server/content.ts";
import { migratePolls } from "./poll-migrations.mjs";

const usage = `Usage: npm run polls -- <command> [arguments]
  migrate
  create-question <question.json>
  import-source <question-id> <source.json>
  review <question-id> <approved|rejected> <review-note.txt>
  publish <question-id>
  publish-daily <YYYY-MM-DD> <ordered-snapshot-ids.json>
  publish-week <YYYY-MM-DD> <seven-ordered-days.json>
  coverage <YYYY-MM-DD>
  quality
  retire <question-id> <reason.txt>
  snapshot <distribution-id>
  daily <YYYY-MM-DD>
Uses POLL_DATABASE_URL. Editorial commands require a trusted database operator.
See docs/poll-pipeline.md before approving or publishing content.`;

async function main() {
  const [command, ...args] = process.argv.slice(2);
  const counts = {
    migrate: 0,
    "create-question": 1,
    "import-source": 2,
    review: 3,
    publish: 1,
    "publish-daily": 2,
    "publish-week": 2,
    coverage: 1,
    quality: 0,
    retire: 2,
    snapshot: 1,
    daily: 1,
  };
  if (!Object.hasOwn(counts, command) || args.length !== counts[command]) {
    console.log(usage);
    if (command && command !== "--help") process.exitCode = 1;
    return;
  }
  if (!process.env.POLL_DATABASE_URL)
    throw new Error("POLL_DATABASE_URL is required");
  if (command === "review" && !["approved", "rejected"].includes(args[1]))
    throw new Error("Review must be approved or rejected");
  const pool = new Pool({
    connectionString: process.env.POLL_DATABASE_URL,
    max: 1,
    connectionTimeoutMillis: 5000,
    statement_timeout: 30_000,
  });
  pool.on("error", () => console.error("Poll database connection unavailable"));
  const client = await pool.connect();
  try {
    const polls = new PollRepository(client);
    const content = new ContentRepository(client);
    const json = async (file) => JSON.parse(await readFile(file, "utf8"));
    let result;
    switch (command) {
      case "migrate": {
        const directory = new URL("../db/migrations/", import.meta.url);
        const migrations = [];
        for (const name of (await readdir(directory))
          .filter((name) => name.endsWith(".sql"))
          .sort()) {
          migrations.push({
            name,
            sql: await readFile(new URL(name, directory), "utf8"),
          });
        }
        result = await migratePolls(
          { query: client.query.bind(client), exec: client.query.bind(client) },
          migrations
        );
        break;
      }
      case "create-question":
        result = await polls.createQuestion(await json(args[0]));
        break;
      case "import-source":
        result = await polls.importSource(args[0], await json(args[1]));
        break;
      case "review":
        result = await polls.review(
          args[0],
          args[1],
          await readFile(args[2], "utf8")
        );
        break;
      case "publish":
        result = await polls.publish(args[0]);
        break;
      case "publish-daily":
        result = await polls.publishDaily(args[0], await json(args[1]));
        break;
      case "snapshot":
        result = await polls.snapshot(args[0]);
        break;
      case "publish-week":
        result = await content.publishWeek(args[0], await json(args[1]));
        break;
      case "coverage":
        result = await content.coverage(args[0]);
        break;
      case "quality":
        result = await content.quality();
        break;
      case "retire":
        result = await content.retire(
          args[0],
          await readFile(args[1], "utf8"),
          new Date()
        );
        break;
      case "daily":
        result = await polls.daily(args[0]);
        break;
    }
    console.log(JSON.stringify(result ?? { status: "ok" }, null, 2));
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  // Database error details may contain submitted content; omit those and URLs.
  console.error(
    error instanceof Error ? error.message : "Poll operation failed"
  );
  process.exitCode = 1;
});
