// @vitest-environment node
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeEach, expect, test } from "vitest";
import { PollRepository } from "./polls";
import { ContentRepository } from "./content";
import { PlayRepository } from "./play";

const db = new PGlite();
const polls = new PollRepository(db);
const content = new ContentRepository(db);
beforeEach(async () => {
  await db.exec("DROP SCHEMA IF EXISTS offcourse_poll CASCADE");
  for (const name of ["001-polls", "002-play", "003-content"])
    await db.exec(await readFile(`db/migrations/${name}.sql`, "utf8"));
}, 30_000);
afterAll(() => db.close());

async function publish(id: string, sampleSize = 100) {
  await polls.createQuestion({
    id,
    prompt: `Synthetic fixture ${id}?`,
    yesLabel: "Yes",
    noLabel: "No",
    category: "fixture",
    sourceType: "licensed_external",
  });
  await polls.importSource(id, {
    yesVotes: 50,
    sampleSize,
    attribution: "Synthetic fixture only",
    citationUrl: "https://example.org/fixture",
    permission: "Fixture only",
    verification: "Fixture only",
  });
  await polls.review(id, "approved", "Synthetic review");
  return (await polls.publish(id)).distribution.id;
}

async function week() {
  const ids: string[] = [];
  for (let i = 0; i < 35; i++) ids.push(await publish(`q-${i}`));
  return Array.from({ length: 7 }, (_, day) => ids.slice(day * 5, day * 5 + 5));
}

test("an editorial week publishes seven stable ordered UTC manifests atomically", async () => {
  const days = await week();
  await content.publishWeek("2026-12-29", days);
  for (const [index, date] of [
    "2026-12-29",
    "2026-12-30",
    "2026-12-31",
    "2027-01-01",
    "2027-01-02",
    "2027-01-03",
    "2027-01-04",
  ].entries()) {
    const manifest = await polls.daily(date);
    expect(manifest?.questions.map((q) => q.distribution.id)).toEqual(
      days[index]
    );
    expect(await polls.daily(date)).toEqual(manifest);
  }
  await expect(content.publishWeek("2026-12-29", days)).rejects.toThrow();
  const invalid = [...days.slice(0, 6), days[0]];
  await expect(content.publishWeek("2027-02-01", invalid)).rejects.toThrow(
    /recent/
  );
  expect(await polls.daily("2027-02-01")).toBeNull();
});

test("coverage requires seven qualified days and 100 distinct endless questions; retirement preserves frozen history", async () => {
  const days = await week();
  await content.publishWeek("2026-10-30", days);
  expect(await content.coverage("2026-10-30")).toEqual({
    ready: false,
    dailyDays: 7,
    endlessQuestions: 35,
  });
  await expect(publish("undersampled", 99)).rejects.toThrow(/100/);
  for (let i = 35; i < 100; i++) await publish(`q-${i}`);
  await polls.publish("q-0"); // A new version is not an additional question.
  expect(await content.coverage("2026-10-30")).toEqual({
    ready: true,
    dailyDays: 7,
    endlessQuestions: 100,
  });
  expect(await content.coverage("2026-10-31")).toEqual({
    ready: false,
    dailyDays: 6,
    endlessQuestions: 100,
  });
  const frozen = await polls.daily("2026-10-30");
  await content.retire(
    "q-0",
    "Ambiguous wording reported",
    new Date("2026-10-30T12:00:00Z")
  );
  expect(await content.coverage("2026-10-30")).toEqual({
    ready: false,
    dailyDays: 6,
    endlessQuestions: 99,
  });
  expect(await polls.daily("2026-10-30")).toEqual(frozen);
  await expect(polls.publish("q-0")).rejects.toThrow();
  await expect(
    polls.review("q-0", "approved", "Try to revive")
  ).rejects.toThrow();
  expect(
    (await content.quality()).find((q) => q.questionId === "q-0")
  ).toMatchObject({
    retiredAt: "2026-10-30T12:00:00.000Z",
    retirementReason: "Ambiguous wording reported",
    sampleSize: 100,
    attempts: 0,
    meanError: null,
    missPercentage: null,
  });
});

test("single-day publication checks neighboring dates and every snapshot version; a seven-day gap is allowed", async () => {
  const days = await week();
  await polls.publishDaily("2026-11-07", days[0]);
  await polls.publish("q-0");
  await expect(
    polls.publishDaily("2026-11-06", ["q-0:v2", ...days[1].slice(1)])
  ).rejects.toThrow(/recent/);
  expect(await polls.daily("2026-11-06")).toBeNull();
  await polls.publishDaily("2026-10-31", days[0]);
  await expect(content.publishWeek("2026-02-30", days)).rejects.toThrow();
  await expect(content.publishWeek("10/30/2026", days)).rejects.toThrow(/UTC/);
  await expect(
    content.publishWeek("2026-12-01", days.slice(0, 6))
  ).rejects.toThrow(/seven/);
});

test("new scored runs wait for sufficient coverage while issued runs survive retirement and UTC rollover", async () => {
  const days = await week();
  await content.publishWeek("2026-10-30", days);
  const plays = new PlayRepository(db);
  const participant = "a".repeat(64);
  const id = "9c158c52-d7aa-4c80-88ee-f85fe1994b74";
  const before = new Date("2026-10-29T17:00:00-07:00"); // Oct 30 UTC
  expect(await plays.start(participant, id, "daily", before)).toEqual({
    status: "not_ready",
  });
  expect(await plays.start(participant, id, "endless", before)).toEqual({
    status: "not_ready",
  });
  for (let i = 35; i < 100; i++) await publish(`q-${i}`);
  const started = await plays.start(participant, id, "daily", before);
  expect(started).toMatchObject({
    status: "ok",
    play: { dateKey: "2026-10-30" },
  });
  await content.retire("q-0", "Needs new wording", before);
  expect(await plays.start(participant, id, "daily", before)).toEqual(started);
  expect(
    await plays.lock(
      participant,
      id,
      { roundIndex: 0, answer: "yes", guessPercentage: 50 },
      new Date("2026-10-30T17:00:00-07:00")
    )
  ).toMatchObject({
    status: "ok",
    play: { results: [{ distribution: { id: "q-0:v1", sampleSize: 100 } }] },
  });
  expect(
    await plays.start(
      participant,
      id,
      "daily",
      new Date("2026-10-31T09:00:00+09:00")
    )
  ).toEqual({ status: "not_ready" });
});

test("endless excludes recently locked questions across versions and runs, then exhausts honestly and recovers after cooldown", async () => {
  await db.exec("SET TIME ZONE 'America/Los_Angeles'");
  const days = await week();
  await content.publishWeek("2026-10-30", days);
  for (let i = 35; i < 100; i++) await publish(`q-${i}`);
  const plays = new PlayRepository(db);
  const participant = "a".repeat(64);
  const id = "9c158c52-d7aa-4c80-88ee-f85fe1994b74";
  const nextId = "9c158c52-d7aa-4c80-88ee-f85fe1994b75";
  const at = new Date("2026-10-30T12:00:00Z");
  const first = await plays.start(participant, id, "endless", at);
  if (first.status !== "ok") throw new Error("Expected play");
  expect(new Set(first.play.questions.map((q) => q.question.id)).size).toBe(
    100
  );
  await plays.lock(
    participant,
    id,
    { roundIndex: 0, answer: "yes", guessPercentage: 50 },
    at
  );
  await polls.publish(first.play.questions[0].question.id);
  const next = await plays.start(participant, nextId, "endless", at);
  if (next.status !== "ok") throw new Error("Expected play");
  expect(next.play.questions).toHaveLength(99);
  expect(
    next.play.questions.some(
      (q) => q.question.id === first.play.questions[0].question.id
    )
  ).toBe(false);
  await plays.lock(
    participant,
    nextId,
    { roundIndex: 0, answer: "yes", guessPercentage: 0 },
    at
  );
  // The original run remains pinned and exhausts its finite pool without loss.
  for (let index = 1; index < 100; index++) {
    const result = await plays.lock(
      participant,
      id,
      { roundIndex: index, answer: "yes", guessPercentage: 50 },
      new Date(at.getTime() + index * 3000)
    );
    expect(result).toMatchObject({
      status: "ok",
      play: { status: index === 99 ? "exhausted" : "active" },
    });
  }
  const later = new Date("2026-10-30T12:10:00Z");
  expect(
    await plays.start(
      participant,
      "9c158c52-d7aa-4c80-88ee-f85fe1994b76",
      "endless",
      later
    )
  ).toEqual({ status: "exhausted" });
  // Quality is aggregated from earned official results, without storing demographics.
  expect(
    (await content.quality()).find(
      (q) => q.questionId === first.play.questions[0].question.id
    )
  ).toMatchObject({ attempts: 1, meanError: 0, missPercentage: 0 });
  expect(
    (await content.quality()).find(
      (q) => q.questionId === next.play.questions[0].question.id
    )
  ).toMatchObject({ attempts: 2, meanError: 25, missPercentage: 50 });
  await content.publishWeek("2026-11-06", days);
  expect(
    await plays.start(
      participant,
      "9c158c52-d7aa-4c80-88ee-f85fe1994b78",
      "endless",
      new Date("2026-11-06T12:00:00Z")
    )
  ).toMatchObject({ status: "ok", play: { questions: { length: 1 } } });
  expect(
    await plays.start(
      participant,
      "9c158c52-d7aa-4c80-88ee-f85fe1994b77",
      "endless",
      new Date("2026-11-06T12:10:00Z")
    )
  ).toMatchObject({ status: "ok", play: { questions: { length: 100 } } });
});

test("upgrading a legacy repeated calendar preserves manifests but does not qualify coverage", async () => {
  await db.exec("DROP SCHEMA offcourse_poll CASCADE");
  for (const name of ["001-polls", "002-play"])
    await db.exec(await readFile(`db/migrations/${name}.sql`, "utf8"));
  const ids: string[] = [];
  for (let i = 0; i < 100; i++) ids.push(await publish(`q-${i}`));
  for (let day = 1; day <= 7; day++)
    await polls.publishDaily(`2026-11-0${day}`, ids.slice(0, 5));
  const frozen = await polls.daily("2026-11-01");
  await db.exec(await readFile("db/migrations/003-content.sql", "utf8"));
  expect(await polls.daily("2026-11-01")).toEqual(frozen);
  expect(await content.coverage("2026-11-01")).toEqual({
    ready: false,
    dailyDays: 7,
    endlessQuestions: 100,
  });
});
