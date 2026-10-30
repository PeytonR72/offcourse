import { expect, test } from "vitest";
import { demoCatalog } from "../data/demo-questions";
import { createDaily, nextDaily, type DailyExpedition } from "./daily";
import { createDailyRepository } from "./daily-repository";
import { transitionRun } from "./run";

function finishRound(expedition: DailyExpedition, percentage: number) {
  let run = expedition.run;
  const entry = expedition.questions[run.completedRounds.length];
  run = transitionRun(run, { type: "choose_answer", answer: "no" });
  run = transitionRun(run, { type: "aim", percentage });
  run = transitionRun(run, { type: "lock" });
  run = transitionRun(run, { type: "launch" });
  run = transitionRun(run, {
    type: "reveal",
    distribution: entry.distribution,
  });
  run = transitionRun(run, { type: "resolve" });
  return { ...expedition, run };
}

test("a daily expedition credits five exact predictions for 500 ly and cannot start a sixth", () => {
  let daily = createDaily(demoCatalog, new Date("2026-10-29T12:00:00Z"));
  for (let index = 0; index < 5; index++) {
    daily = finishRound(
      daily,
      daily.questions[index].distribution.yesPercentage
    );
    if (index < 4) daily = nextDaily(daily);
  }
  expect(daily.run.completedRounds).toHaveLength(5);
  expect(daily.run.totalDistance).toBe(500);
  expect(() => nextDaily(daily)).toThrow(/complete/i);
});

test("five misses still finish the daily expedition with zero distance", () => {
  let daily = createDaily(demoCatalog, new Date("2026-10-29T12:00:00Z"));
  for (let index = 0; index < 5; index++) {
    const actual = daily.questions[index].distribution.yesPercentage;
    daily = finishRound(daily, actual < 50 ? 100 : 0);
    if (index < 4) daily = nextDaily(daily);
  }
  expect(daily.run.completedRounds).toHaveLength(5);
  expect(daily.run.totalDistance).toBe(0);
  expect(daily.run.status).toBe("active");
});

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

test("reload after lock resumes the pinned answer and credits it only once", () => {
  const storage = memoryStorage();
  const clock = () => new Date("2026-10-29T12:00:00Z");
  const repository = createDailyRepository(storage, demoCatalog, clock);
  const daily = repository.load();
  let run = transitionRun(daily.run, { type: "choose_answer", answer: "yes" });
  run = transitionRun(run, {
    type: "aim",
    percentage: daily.questions[0].distribution.yesPercentage,
  });
  run = transitionRun(run, { type: "lock" });
  repository.save({ ...daily, run });
  const resumed = createDailyRepository(storage, demoCatalog, clock).load();
  expect(resumed.run.round.phase).toBe("resolved");
  expect(resumed.run.completedRounds).toHaveLength(1);
  expect(resumed.run.totalDistance).toBe(100);
  expect(
    createDailyRepository(storage, demoCatalog, clock).load().run.totalDistance
  ).toBe(100);
  expect(resumed.questions).toEqual(daily.questions);
});

test("the same UTC day has the same questions across independent installations", () => {
  const first = createDailyRepository(
    memoryStorage(),
    demoCatalog,
    () => new Date("2026-10-29T01:00:00+01:00")
  ).load();
  const second = createDailyRepository(
    memoryStorage(),
    demoCatalog,
    () => new Date("2026-10-29T23:59:59Z")
  ).load();
  expect(first.questions).toEqual(second.questions);
  expect(first.dateKey).toBe("2026-10-29");
});

test("completed attempts restore their summary instead of allowing a same-day replay", () => {
  const storage = memoryStorage();
  const clock = () => new Date("2026-10-29T23:59:59Z");
  const repository = createDailyRepository(storage, demoCatalog, clock);
  let daily = repository.load();
  for (let index = 0; index < 5; index++) {
    daily = finishRound(
      daily,
      daily.questions[index].distribution.yesPercentage
    );
    if (index < 4) daily = nextDaily(daily);
    repository.save(daily);
  }
  // A catalog deployment cannot change an already frozen attempt.
  const resumed = createDailyRepository(
    storage,
    { ...demoCatalog, version: 2, entries: [] },
    clock
  ).load();
  expect(resumed.run.completedRounds).toHaveLength(5);
  expect(resumed.run.totalDistance).toBe(500);
  expect(resumed.questions).toEqual(daily.questions);
  expect(() => nextDaily(resumed)).toThrow(/complete/i);
});

test("UTC midnight unlocks a fresh expedition and rejects writes to yesterday's attempt", () => {
  const storage = memoryStorage();
  let now = new Date("2026-10-29T23:59:59Z");
  const repository = createDailyRepository(storage, demoCatalog, () => now);
  const previous = finishRound(repository.load(), 0);
  repository.save(previous);
  now = new Date("2026-10-30T00:00:00Z");
  expect(() => repository.save(previous)).toThrow(/date changed/i);
  const today = repository.load();
  expect(today.dateKey).toBe("2026-10-30");
  expect(today.run.completedRounds).toHaveLength(0);
  expect(today.run.totalDistance).toBe(0);
  expect(today.run.round.phase).toBe("answering");
});

test("unlocked personal answer and prediction survive reload", () => {
  const storage = memoryStorage();
  const clock = () => new Date("2026-10-29T12:00:00Z");
  const repository = createDailyRepository(storage, demoCatalog, clock);
  const daily = repository.load();
  let run = transitionRun(daily.run, { type: "choose_answer", answer: "no" });
  run = transitionRun(run, { type: "aim", percentage: 73 });
  repository.save({ ...daily, run });
  const resumed = createDailyRepository(storage, demoCatalog, clock).load();
  expect(resumed.run.round).toMatchObject({
    phase: "aiming",
    answer: "no",
    guessPercentage: 73,
  });
  expect(resumed.run.completedRounds).toHaveLength(0);
});

test("a stale tab cannot overwrite a prediction locked in another tab", () => {
  const storage = memoryStorage();
  const clock = () => new Date("2026-10-29T12:00:00Z");
  const first = createDailyRepository(storage, demoCatalog, clock);
  const second = createDailyRepository(storage, demoCatalog, clock);
  const daily = first.load();
  const stale = second.load();
  first.save(finishRound(daily, 44));
  expect(() => second.save(stale)).toThrow(/another tab/i);
  expect(second.load().run.completedRounds).toHaveLength(1);
});

test("corrupted records and unavailable storage fail without granting a new attempt", () => {
  const storage = memoryStorage();
  const clock = () => new Date("2026-10-29T12:00:00Z");
  storage.setItem("offcourse:daily:v1:2026-10-29", "broken json");
  expect(() =>
    createDailyRepository(storage, demoCatalog, clock).load()
  ).toThrow();
  expect(storage.getItem("offcourse:daily:v1:2026-10-29")).toBe("broken json");
  const denied = {
    getItem() {
      return null;
    },
    setItem() {
      throw new Error("Storage denied");
    },
  };
  expect(() =>
    createDailyRepository(denied, demoCatalog, clock).load()
  ).toThrow("Storage denied");
});
