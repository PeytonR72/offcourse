// @vitest-environment node
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeEach, expect, test } from "vitest";
import { PollRepository } from "./polls";
import { createVoteHandler } from "./vote-http";

const db = new PGlite();
const polls = new PollRepository(db);
const question = {
  id: "tea",
  prompt: "Would you choose tea over coffee today?",
  yesLabel: "Tea",
  noLabel: "Coffee",
  category: "everyday",
  sourceType: "first_party" as const,
};
const review = "Clear binary wording; no personal data or targeted content.";
const at = new Date("2026-10-30T12:00:00Z");
const key = (index: number) => index.toString(16).padStart(64, "0");

beforeEach(async () => {
  await db.exec("DROP SCHEMA IF EXISTS offcourse_poll CASCADE");
  await db.exec(await readFile("db/migrations/001-polls.sql", "utf8"));
  await db.exec(await readFile("db/migrations/002-play.sql", "utf8"));
  await db.exec(await readFile("db/migrations/003-content.sql", "utf8"));
}, 30_000);
afterAll(() => db.close());

async function approvedPoll() {
  await polls.createQuestion(question);
  await polls.review(question.id, "approved", review);
}

async function votes(count: number) {
  for (let index = 1; index <= count; index++) {
    expect(
      await polls.vote(
        question.id,
        key(index),
        index <= 67 ? "YES" : "NO",
        "poll-v1",
        at
      )
    ).toBe("accepted");
  }
}

test("only editorially approved first-party questions accept consented unique votes", async () => {
  await polls.createQuestion(question);
  expect(await polls.vote(question.id, key(1), "YES", "poll-v1", at)).toBe(
    "unavailable"
  );
  await polls.review(question.id, "approved", review);
  expect(await polls.vote(question.id, key(1), "YES", "poll-v1", at)).toBe(
    "accepted"
  );
  expect(await polls.vote(question.id, key(1), "NO", "poll-v1", at)).toBe(
    "duplicate"
  );
  expect(await polls.vote(question.id, key(2), "NO", "", at)).toBe("invalid");
});

test("publication requires 100 independent consented votes and derives the percentage", async () => {
  await approvedPoll();
  await votes(99);
  await expect(polls.publish(question.id)).rejects.toThrow(/100/);
  await polls.vote(question.id, key(100), "NO", "poll-v1", at);
  const snapshot = await polls.publish(question.id);
  expect(snapshot.question).toMatchObject({
    id: "tea",
    status: "published",
    distributionId: "tea:v1",
  });
  expect(snapshot.distribution).toMatchObject({
    id: "tea:v1",
    version: 1,
    yesPercentage: 67,
    sampleSize: 100,
    eligibilityStatus: "eligible",
    sourceAttribution: "Offcourse anonymous consented poll (poll-v1)",
  });
});

test("published versions cannot be edited, deleted, or truncated and later votes create a new version", async () => {
  await approvedPoll();
  await votes(100);
  const original = await polls.publish(question.id);
  await expect(
    db.query("UPDATE offcourse_poll.snapshots SET yes_votes = 0")
  ).rejects.toThrow(/immutable/);
  await expect(
    db.query("DELETE FROM offcourse_poll.snapshots")
  ).rejects.toThrow(/immutable/);
  await expect(
    db.query("TRUNCATE offcourse_poll.snapshots CASCADE")
  ).rejects.toThrow(/immutable/);
  await polls.vote(question.id, key(101), "NO", "poll-v1", at);
  expect((await polls.publish(question.id)).distribution).toMatchObject({
    version: 2,
    sampleSize: 101,
  });
  expect(await polls.snapshot("tea:v1")).toEqual(original);
});

test("sourced counts require citation, permission, verification, and a fresh editorial approval", async () => {
  await polls.createQuestion({ ...question, sourceType: "licensed_external" });
  await polls.review(question.id, "approved", review);
  const source = {
    yesVotes: 125,
    sampleSize: 200,
    attribution: "Synthetic licensed-source fixture",
    citationUrl: "https://example.org/poll",
    permission: "Fixture permission only",
    verification: "Independent respondents; exact wording and counts checked.",
  };
  await expect(
    polls.importSource(question.id, { ...source, attribution: "" })
  ).rejects.toThrow();
  await expect(
    polls.importSource(question.id, { ...source, yesVotes: 201 })
  ).rejects.toThrow();
  await polls.importSource(question.id, source);
  await expect(polls.publish(question.id)).rejects.toThrow(/review/);
  await polls.review(question.id, "approved", review);
  const snapshot = await polls.publish(question.id);
  expect(snapshot.distribution).toMatchObject({
    yesPercentage: 62.5,
    sampleSize: 200,
    sourceAttribution:
      "Synthetic licensed-source fixture — https://example.org/poll",
  });
  expect(await polls.vote(question.id, key(1), "YES", "poll-v1", at)).toBe(
    "unavailable"
  );
  await polls.importSource(question.id, {
    ...source,
    sampleSize: 99,
    yesVotes: 50,
  });
  await polls.review(question.id, "approved", review);
  await expect(polls.publish(question.id)).rejects.toThrow(/100/);
  expect(await polls.snapshot(snapshot.distribution.id)).toEqual(snapshot);
});

test("daily publication pins exactly five different approved questions and cannot replace a UTC day", async () => {
  const ids: string[] = [];
  for (let index = 0; index < 5; index++) {
    const id = `daily-${index}`;
    await polls.createQuestion({
      ...question,
      id,
      sourceType: "licensed_external",
    });
    await polls.importSource(id, {
      yesVotes: 50,
      sampleSize: 100,
      attribution: "Synthetic fixture",
      citationUrl: "https://example.org/poll",
      permission: "Fixture only",
      verification: "Fixture only",
    });
    await polls.review(id, "approved", review);
    ids.push((await polls.publish(id)).distribution.id);
  }
  await expect(
    polls.publishDaily("2026-10-30", ids.slice(0, 4))
  ).rejects.toThrow(/five/);
  await expect(
    polls.publishDaily("2026-10-30", [ids[0], ids[0], ...ids.slice(2)])
  ).rejects.toThrow(/different/);
  await expect(polls.publishDaily("2026-02-30", ids)).rejects.toThrow();
  await expect(polls.publishDaily("10/30/2026", ids)).rejects.toThrow(/UTC/);
  await expect(
    polls.publishDaily("2026-10-30", [...ids.slice(0, 4), "missing:v1"])
  ).rejects.toThrow(/approved/);
  const manifest = await polls.publishDaily("2026-10-30", ids);
  expect(manifest).toMatchObject({ dateKey: "2026-10-30", version: 1 });
  expect(manifest.questions.map(({ distribution }) => distribution.id)).toEqual(
    ids
  );
  expect(await polls.daily("2026-10-30")).toEqual(manifest);
  expect(await polls.daily("2026-10-31")).toBeNull();
  await expect(
    polls.publishDaily("2026-10-30", [...ids].reverse())
  ).rejects.toThrow();
  await expect(
    db.query("UPDATE offcourse_poll.daily_manifests SET version = 2")
  ).rejects.toThrow(/immutable/);
  await expect(
    db.query("DELETE FROM offcourse_poll.daily_manifests")
  ).rejects.toThrow(/immutable/);
  await expect(
    db.query("TRUNCATE offcourse_poll.daily_manifests")
  ).rejects.toThrow(/immutable/);
  await polls.review(
    "daily-0",
    "rejected",
    "Wording no longer meets editorial policy"
  );
  await expect(polls.publishDaily("2026-10-31", ids)).rejects.toThrow(
    /approved/
  );
  expect(await polls.daily("2026-10-30")).toEqual(manifest);
});

test("vote throttling survives new repository instances, counts duplicate attempts, and resets after a minute", async () => {
  await approvedPoll();
  expect(await polls.vote(question.id, key(1), "YES", "poll-v1", at)).toBe(
    "accepted"
  );
  const otherInstance = new PollRepository(db);
  for (let attempt = 2; attempt <= 10; attempt++) {
    expect(
      await otherInstance.vote(question.id, key(1), "YES", "poll-v1", at)
    ).toBe("duplicate");
  }
  expect(await polls.vote(question.id, key(1), "YES", "poll-v1", at)).toBe(
    "rate_limited"
  );
  expect(
    await polls.vote(
      question.id,
      key(1),
      "YES",
      "poll-v1",
      new Date(at.getTime() + 60_000)
    )
  ).toBe("duplicate");
  expect(await polls.vote(question.id, key(2), "NO", "poll-v1", at)).toBe(
    "accepted"
  );
});

test("unreviewed, rejected, missing, simulated and malformed content never publishes", async () => {
  await polls.createQuestion(question);
  await expect(polls.publish(question.id)).rejects.toThrow(/review/);
  await expect(polls.publish("missing")).rejects.toThrow(/review/);
  await expect(polls.review(question.id, "approved", " ")).rejects.toThrow();
  await polls.review(question.id, "rejected", review);
  await expect(polls.publish(question.id)).rejects.toThrow(/review/);
  await expect(
    db.query(
      "INSERT INTO offcourse_poll.questions (id,prompt,yes_label,no_label,category,source_type) VALUES ('demo','Q','Y','N','test','simulated')"
    )
  ).rejects.toThrow();
  expect(await polls.vote(question.id, key(1), "MAYBE", "poll-v1", at)).toBe(
    "invalid"
  );
  expect(
    await polls.vote(question.id, "raw-installation-id", "YES", "poll-v1", at)
  ).toBe("invalid");
});

const installationId = "9c158c52-d7aa-4c80-88ee-f85fe1994b74";
const payload = {
  installationId,
  answer: "YES",
  consent: { accepted: true, version: "poll-v1" },
};
const request = (
  body: unknown = payload,
  headers: Record<string, string> = {}
) =>
  new Request("https://offcourse.example/api/polls/tea/votes", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
const handleVote = createVoteHandler({
  repository: polls,
  secret: "test-secret-at-least-thirty-two-characters",
  clock: () => at,
});

test("HTTP intake records a consented anonymous vote without exposing counts or identifiers", async () => {
  await approvedPoll();
  const response = await handleVote(request(), question.id);
  expect(response.status).toBe(201);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toEqual({ status: "accepted" });
  expect((await handleVote(request(), question.id)).status).toBe(409);
});

test.each([
  { ...payload, consent: { accepted: false, version: "poll-v1" } },
  { ...payload, consent: { accepted: true, version: "old" } },
  { ...payload, consent: null },
  { ...payload, installationId: "fingerprint" },
  { ...payload, answer: "MAYBE" },
  { ...payload, email: "unnecessary@example.org" },
  null,
])("HTTP intake rejects invalid consent or input: %j", async (body) => {
  await approvedPoll();
  expect((await handleVote(request(body), question.id)).status).toBe(400);
  expect((await handleVote(request(), question.id)).status).toBe(201);
});

test("HTTP intake rejects malformed, oversized, cross-origin and non-JSON requests", async () => {
  await approvedPoll();
  const malformed = new Request(request(), { body: "{" });
  expect((await handleVote(malformed, question.id)).status).toBe(400);
  expect(
    (
      await handleVote(
        request(payload, { origin: "https://elsewhere.example" }),
        question.id
      )
    ).status
  ).toBe(403);
  expect(
    (
      await handleVote(
        request(payload, { "content-type": "text/plain" }),
        question.id
      )
    ).status
  ).toBe(415);
  const oversized = new Request(request(), { body: " ".repeat(2049) });
  expect((await handleVote(oversized, question.id)).status).toBe(413);
  const chunks = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(" ".repeat(1000)));
      controller.enqueue(new TextEncoder().encode(" ".repeat(1049)));
      controller.close();
    },
  });
  const streamingOptions: RequestInit & { duplex: string } = {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: chunks,
    duplex: "half",
  };
  const streaming = new Request(
    "https://offcourse.example/api/polls/tea/votes",
    streamingOptions
  );
  expect((await handleVote(streaming, question.id)).status).toBe(413);
  expect((await handleVote(request(), "bad/id")).status).toBe(400);
});

test("HTTP throttle returns retry guidance and a database outage returns no internal error", async () => {
  await approvedPoll();
  for (let attempt = 0; attempt < 10; attempt++)
    await handleVote(request(), question.id);
  const limited = await handleVote(request(), question.id);
  expect(limited.status).toBe(429);
  expect(limited.headers.get("retry-after")).toBe("60");
  const offline = createVoteHandler({
    repository: {
      vote: async () => {
        throw new Error("private database credentials");
      },
    },
    secret: "test-secret-at-least-thirty-two-characters",
    clock: () => at,
  });
  const response = await offline(request(), question.id);
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ status: "unavailable" });
});

test("an intake database role can submit votes but cannot read answers or publish content", async () => {
  await approvedPoll();
  await db.exec(`CREATE ROLE offcourse_test_intake NOLOGIN;
    GRANT USAGE ON SCHEMA offcourse_poll TO offcourse_test_intake;
    GRANT EXECUTE ON FUNCTION offcourse_poll.submit_vote(text,text,text,text,timestamptz) TO offcourse_test_intake;
    SET ROLE offcourse_test_intake;`);
  try {
    expect(await polls.vote(question.id, key(1), "YES", "poll-v1", at)).toBe(
      "accepted"
    );
    await expect(polls.publish(question.id)).rejects.toThrow(/permission/);
    await expect(polls.snapshot("tea:v1")).rejects.toThrow(/permission/);
    await expect(
      db.query("SELECT * FROM offcourse_poll.votes")
    ).rejects.toThrow(/permission/);
  } finally {
    await db.exec(
      "RESET ROLE; DROP OWNED BY offcourse_test_intake; DROP ROLE offcourse_test_intake;"
    );
  }
});
