// @vitest-environment node
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeEach, expect, test } from "vitest";
import { PollRepository } from "./polls";
import { PlayRepository } from "./play";
import { createPlayHandlers } from "./play-http";

const db = new PGlite();
const polls = new PollRepository(db);
const rolloverId = "9c158c52-d7aa-4c80-88ee-f85fe1994b76";
const plays = new PlayRepository(db, () => rolloverId);
const at = new Date("2026-10-30T12:00:00Z");
const participant = "a".repeat(64);
const runId = "9c158c52-d7aa-4c80-88ee-f85fe1994b74";
const otherId = "9c158c52-d7aa-4c80-88ee-f85fe1994b75";

beforeEach(async () => {
  await db.exec("DROP SCHEMA IF EXISTS offcourse_poll CASCADE");
  await db.exec(await readFile("db/migrations/001-polls.sql", "utf8"));
  await db.exec(await readFile("db/migrations/002-play.sql", "utf8"));
}, 30_000);
afterAll(() => db.close());

async function publish(id: string, yesVotes = 67) {
  await polls.createQuestion({
    id,
    prompt: `Test proposition ${id}?`,
    yesLabel: "Yes",
    noLabel: "No",
    category: "fixture",
    sourceType: "licensed_external",
  });
  await polls.importSource(id, {
    yesVotes,
    sampleSize: 100,
    attribution: "Synthetic test fixture",
    citationUrl: "https://example.org/fixture",
    permission: "Fixture only",
    verification: "Fixture only",
  });
  await polls.review(id, "approved", "Synthetic fixture review");
  return (await polls.publish(id)).distribution.id;
}

async function daily() {
  const ids = [];
  for (let i = 0; i < 5; i++) ids.push(await publish(`q-${i}`));
  await polls.publishDaily("2026-10-30", ids);
}

test("starting a daily pins safe question fields and resumes one participation per UTC day", async () => {
  await daily();
  const result = await plays.start(participant, runId, "daily", at);
  expect(result.status).toBe("ok");
  if (result.status !== "ok") throw new Error("Expected play");
  expect(result.play).toMatchObject({
    id: runId,
    mode: "daily",
    dateKey: "2026-10-30",
    status: "active",
    totalDistance: 0,
    streak: 0,
    results: [],
  });
  expect(result.play.questions).toHaveLength(5);
  expect(result.play.questions[0]).toEqual({
    question: {
      id: "q-0",
      prompt: "Test proposition q-0?",
      yesLabel: "Yes",
      noLabel: "No",
      category: "fixture",
      sourceType: "licensed_external",
      status: "published",
      distributionId: "q-0:v1",
    },
    distributionVersion: 1,
  });
  expect(JSON.stringify(result)).not.toMatch(
    /yesPercentage|sampleSize|sourceAttribution|participant/
  );
  expect(await plays.start(participant, otherId, "daily", at)).toEqual(result);
});

test("locking computes official scores once, rejects changed or out-of-order guesses, and keeps the pinned version", async () => {
  await daily();
  await plays.start(participant, runId, "daily", at);
  await polls.importSource("q-0", {
    yesVotes: 0,
    sampleSize: 100,
    attribution: "New fixture",
    citationUrl: "https://example.org/new",
    permission: "Fixture only",
    verification: "Fixture only",
  });
  await polls.review("q-0", "approved", "New fixture review");
  await polls.publish("q-0");
  const prediction = {
    roundIndex: 0,
    answer: "no" as const,
    guessPercentage: 57,
  };
  expect(
    await plays.lock(participant, runId, { ...prediction, roundIndex: 1 }, at)
  ).toEqual({ status: "conflict" });
  const locked = await plays.lock(participant, runId, prediction, at);
  expect(locked.status).toBe("ok");
  if (locked.status !== "ok") throw new Error("Expected play");
  expect(locked.play).toMatchObject({
    totalDistance: 50,
    status: "active",
    results: [
      {
        lock: { answer: "no", guessPercentage: 57, distributionVersion: 1 },
        distribution: { id: "q-0:v1", yesPercentage: 67, version: 1 },
        score: { distance: 50, error: 10, survived: true },
      },
    ],
  });
  expect(JSON.stringify(locked.play.questions)).not.toContain("yesPercentage");
  expect(
    await new PlayRepository(db).lock(participant, runId, prediction, at)
  ).toEqual(locked);
  expect(
    await plays.lock(
      participant,
      runId,
      { ...prediction, guessPercentage: 67 },
      at
    )
  ).toMatchObject({ status: "conflict", play: locked.play });
  expect(await plays.lock("b".repeat(64), runId, prediction, at)).toEqual({
    status: "unavailable",
  });
});

test("participation requests are throttled across repositories, including retries and unavailable runs", async () => {
  for (let i = 0; i < 30; i++) {
    expect(
      await new PlayRepository(db).start(participant, runId, "daily", at)
    ).toEqual({ status: "unavailable" });
  }
  expect(
    await plays.lock(
      participant,
      runId,
      { roundIndex: 0, answer: "yes", guessPercentage: 50 },
      at
    )
  ).toEqual({ status: "rate_limited" });
  expect(
    await plays.start(
      participant,
      runId,
      "daily",
      new Date(at.getTime() + 60_000)
    )
  ).toEqual({ status: "unavailable" });
});

const installationId = runId;
const payload = { installationId, requestId: runId, mode: "daily" };
const request = (body: unknown = payload, headers = {}) =>
  new Request("https://offcourse.example/api/play", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
const http = createPlayHandlers({
  repository: plays,
  secret: "fixture-secret-at-least-thirty-two-characters",
  clock: () => at,
});

test("HTTP manifests hide every unearned distribution; lock accepts only predictions and returns the official result", async () => {
  await daily();
  const response = await http.start(request());
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(JSON.stringify(await response.json())).not.toMatch(
    /yesPercentage|sampleSize|participant|sourceAttribution/
  );
  const guess = {
    installationId,
    roundIndex: 0,
    answer: "yes",
    guessPercentage: 56,
  };
  expect(
    (await http.lock(request({ ...guess, score: 100 }), runId)).status
  ).toBe(400);
  const reveal = await http.lock(request(guess), runId);
  expect(reveal.status).toBe(200);
  expect(await reveal.json()).toMatchObject({
    status: "ok",
    play: {
      totalDistance: 45,
      results: [
        {
          score: { error: 11, survived: false, distance: 45 },
          distribution: { version: 1, yesPercentage: 67 },
        },
      ],
    },
  });
});

test("daily continues all five misses, resumes completion, and starts a fresh server UTC day", async () => {
  await daily();
  await plays.start(participant, runId, "daily", at);
  for (let roundIndex = 0; roundIndex < 5; roundIndex++) {
    const reply = await plays.lock(
      participant,
      runId,
      { roundIndex, answer: "no", guessPercentage: 0 },
      at
    );
    expect(reply).toMatchObject({
      status: "ok",
      play: {
        totalDistance: 0,
        status: roundIndex === 4 ? "complete" : "active",
        results: { length: roundIndex + 1 },
      },
    });
  }
  expect(await plays.start(participant, otherId, "daily", at)).toMatchObject({
    status: "ok",
    play: { id: runId, status: "complete" },
  });
  await polls.publishDaily("2026-10-31", [
    "q-0:v1",
    "q-1:v1",
    "q-2:v1",
    "q-3:v1",
    "q-4:v1",
  ]);
  expect(
    await plays.start(
      participant,
      runId,
      "daily",
      new Date("2026-10-31T00:00:00Z")
    )
  ).toMatchObject({
    status: "ok",
    play: {
      id: rolloverId,
      dateKey: "2026-10-31",
      status: "active",
      results: [],
      totalDistance: 0,
    },
  });
});

test("endless pins one latest approved version per question, distinguishes exhaustion from loss, and prevents post-loss advance", async () => {
  await publish("a");
  await polls.publish("a");
  await publish("b");
  await publish("rejected");
  await polls.review("rejected", "rejected", "Retired fixture");
  const start = await plays.start(participant, runId, "endless", at);
  expect(start).toMatchObject({
    status: "ok",
    play: {
      questions: [
        { question: { id: "a", distributionId: "a:v2" } },
        { question: { id: "b" } },
      ],
    },
  });
  await plays.lock(
    participant,
    runId,
    { roundIndex: 0, answer: "yes", guessPercentage: 57 },
    at
  );
  expect(
    await plays.lock(
      participant,
      runId,
      { roundIndex: 1, answer: "yes", guessPercentage: 67 },
      at
    )
  ).toMatchObject({
    status: "ok",
    play: { status: "exhausted", totalDistance: 150, streak: 2 },
  });
  await plays.start(participant, otherId, "endless", at);
  const prediction = {
    roundIndex: 0,
    answer: "yes" as const,
    guessPercentage: 56,
  };
  const lost = await plays.lock(participant, otherId, prediction, at);
  expect(lost).toMatchObject({
    status: "ok",
    play: { status: "lost", totalDistance: 0, streak: 0 },
  });
  expect(
    await plays.lock(participant, otherId, { ...prediction, roundIndex: 1 }, at)
  ).toEqual({ status: "conflict" });
  expect(await plays.lock(participant, otherId, prediction, at)).toEqual(lost);
});

test("a failed commit rolls back the credit and the same lock can safely be retried", async () => {
  await publish("a");
  await plays.start(participant, runId, "endless", at);
  const interrupted = new PlayRepository({
    transaction: (work) =>
      db.transaction(async (transaction) => {
        await work(transaction);
        throw new Error("Disconnected before commit");
      }),
  });
  const prediction = {
    roundIndex: 0,
    answer: "yes" as const,
    guessPercentage: 67,
  };
  await expect(
    interrupted.lock(participant, runId, prediction, at)
  ).rejects.toThrow(/Disconnected/);
  expect(await plays.start(participant, runId, "endless", at)).toMatchObject({
    status: "ok",
    play: { results: [], totalDistance: 0 },
  });
  const results = await Promise.all([
    plays.lock(participant, runId, prediction, at),
    plays.lock(participant, runId, prediction, at),
  ]);
  expect(results[0]).toEqual(results[1]);
  expect(results[0]).toMatchObject({
    status: "ok",
    play: { totalDistance: 100, results: { length: 1 } },
  });
});

test("HTTP rejects malformed, oversized, cross-origin, extra-field and invalid prediction requests", async () => {
  expect((await http.start(new Request(request(), { body: "{" }))).status).toBe(
    400
  );
  expect(
    (await http.start(new Request(request(), { body: " ".repeat(2049) })))
      .status
  ).toBe(413);
  expect(
    (await http.start(request(payload, { origin: "https://evil.example" })))
      .status
  ).toBe(403);
  expect(
    (await http.start(request(payload, { "content-type": "text/plain" })))
      .status
  ).toBe(415);
  for (const body of [
    null,
    [],
    { ...payload, installationId: "fingerprint" },
    { ...payload, dateKey: "2026-10-29" },
    { ...payload, mode: "practice" },
  ])
    expect((await http.start(request(body))).status).toBe(400);
  for (const guess of [-1, 101, 5.5, null, "50"])
    expect(
      (
        await http.lock(
          request({
            installationId,
            roundIndex: 0,
            answer: "yes",
            guessPercentage: guess,
          }),
          runId
        )
      ).status
    ).toBe(400);
  expect(
    (
      await http.lock(
        request({
          installationId,
          roundIndex: -1,
          answer: "yes",
          guessPercentage: 50,
        }),
        runId
      )
    ).status
  ).toBe(400);
  expect(
    (
      await http.lock(
        request({
          installationId,
          roundIndex: 0,
          answer: "yes",
          guessPercentage: 50,
        }),
        "invalid"
      )
    ).status
  ).toBe(400);
});

test("HTTP outages and throttling return safe no-store responses with retry guidance", async () => {
  const offline = createPlayHandlers({
    repository: new PlayRepository({
      transaction: async () => {
        throw new Error("Private credentials");
      },
    }),
    secret: "test",
    clock: () => at,
  });
  const response = await offline.start(request());
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({ status: "unavailable" });
  for (let i = 0; i < 30; i++) await http.start(request());
  const limited = await http.start(request());
  expect(limited.status).toBe(429);
  expect(limited.headers.get("retry-after")).toBe("60");
  expect(limited.headers.get("cache-control")).toBe("no-store");
});
