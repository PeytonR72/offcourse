import { spawn } from "node:child_process";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { Pool } from "pg";
import { PollRepository } from "../src/server/polls.ts";
import { migratePolls } from "./poll-migrations.mjs";

// An isolated local PostgreSQL cluster, never a developer/hosted database.
const root = await mkdtemp(join(tmpdir(), "offcourse-play-"));
const pgBin =
  process.env.PG_BIN ??
  (process.platform === "win32" ? "C:/Program Files/PostgreSQL/18/bin" : "");
const binary = (name) =>
  pgBin
    ? join(pgBin, name + (process.platform === "win32" ? ".exe" : ""))
    : name;
async function run(command, args, options = {}) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      windowsHide: true,
      ...options,
    });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolveRun() : reject(new Error(`${command} exited ${code}`))
    );
  });
}
const listener = createServer();
await new Promise((resolveListen) =>
  listener.listen(0, "127.0.0.1", resolveListen)
);
const port = listener.address().port;
await new Promise((resolveClose) => listener.close(resolveClose));
let started = false;
let pool;
try {
  await run(binary("initdb"), [
    "-D",
    join(root, "data"),
    "-U",
    "offcourse_test",
    "--auth=trust",
    "--no-locale",
    "--encoding=UTF8",
  ]);
  await run(binary("pg_ctl"), [
    "-D",
    join(root, "data"),
    "-l",
    join(root, "postgres.log"),
    "-o",
    // Use only loopback TCP; distro Unix-socket paths may require postgres-group access.
    `-h 127.0.0.1 -p ${port} -c unix_socket_directories=`,
    "-w",
    "start",
  ]);
  started = true;
  pool = new Pool({
    connectionString: `postgresql://offcourse_test@127.0.0.1:${port}/postgres`,
  });
  const client = await pool.connect();
  try {
    const names = (await readdir("db/migrations"))
      .filter((name) => name.endsWith(".sql"))
      .sort();
    const migrations = await Promise.all(
      names.map(async (name) => ({
        name,
        sql: await readFile(join("db/migrations", name), "utf8"),
      }))
    );
    await migratePolls(
      { query: client.query.bind(client), exec: client.query.bind(client) },
      migrations
    );
  } finally {
    client.release();
  }
  const polls = new PollRepository(pool);
  const ids = [];
  for (let i = 0; i < 100; i++) {
    const id = `fixture-${i}`;
    await polls.createQuestion({
      id,
      prompt: `Synthetic test question ${i + 1}?`,
      yesLabel: "Yes",
      noLabel: "No",
      category: "fixture",
      sourceType: "licensed_external",
    });
    await polls.importSource(id, {
      yesVotes: 67,
      sampleSize: 100,
      attribution: "SYNTHETIC TEST FIXTURE — not real crowd data",
      citationUrl: "https://example.org/fixture",
      permission: "Fixture only",
      verification: "Fixture only",
    });
    await polls.review(id, "approved", "Synthetic test fixture only");
    ids.push((await polls.publish(id)).distribution.id);
  }
  const today = new Date();
  for (let day = 0; day < 8; day++) {
    await polls.publishDaily(
      new Date(today.getTime() + day * 86_400_000).toISOString().slice(0, 10),
      ids.slice(day * 5, day * 5 + 5)
    );
  }
  await pool.query(`CREATE ROLE offcourse_play LOGIN;
    GRANT USAGE ON SCHEMA offcourse_poll TO offcourse_play;
    GRANT SELECT ON offcourse_poll.questions, offcourse_poll.snapshots, offcourse_poll.daily_manifests TO offcourse_play;
    GRANT SELECT ON offcourse_poll.eligible_snapshots TO offcourse_play;
    GRANT EXECUTE ON FUNCTION offcourse_poll.content_coverage(date) TO offcourse_play;
    GRANT SELECT, INSERT, UPDATE ON offcourse_poll.play_runs, offcourse_poll.play_limits TO offcourse_play;
    GRANT SELECT, INSERT ON offcourse_poll.play_results TO offcourse_play;
    GRANT EXECUTE ON FUNCTION offcourse_poll.snapshot_json(text) TO offcourse_play;`);
  await run(
    process.execPath,
    [
      "node_modules/@playwright/test/cli.js",
      "test",
      "--config=playwright.server.config.ts",
    ],
    {
      env: {
        ...process.env,
        PLAY_TEST_DATABASE_URL: `postgresql://offcourse_play@127.0.0.1:${port}/postgres`,
      },
    }
  );
} catch (error) {
  const log = await readFile(join(root, "postgres.log"), "utf8").catch(
    () => null
  );
  if (log) console.error(log);
  throw error;
} finally {
  await pool?.end();
  if (started)
    await run(binary("pg_ctl"), [
      "-D",
      join(root, "data"),
      "-m",
      "fast",
      "-w",
      "stop",
    ]);
  const resolved = resolve(root);
  if (
    dirname(resolved) !== resolve(tmpdir()) ||
    !basename(resolved).startsWith("offcourse-play-")
  )
    throw new Error("Unexpected temporary cluster path");
  await rm(resolved, { recursive: true, force: true });
}
