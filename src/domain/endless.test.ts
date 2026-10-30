import { expect, test } from "vitest";
import { demoCatalog } from "../data/demo-questions";
import {
  createEndless,
  endlessProgress,
  nextEndless,
  type EndlessVoyage,
} from "./endless";
import { transitionRun } from "./run";
import { createEndlessRepository } from "./endless-repository";

function finish(voyage: EndlessVoyage, error: number): EndlessVoyage {
  const entry = voyage.questions[voyage.run.completedRounds.length];
  const actual = entry.distribution.yesPercentage;
  let run = transitionRun(voyage.run, { type: "choose_answer", answer: "no" });
  run = transitionRun(run, {
    type: "aim",
    percentage: actual > 50 ? actual - error : actual + error,
  });
  run = transitionRun(run, { type: "lock" });
  run = transitionRun(run, { type: "launch" });
  run = transitionRun(run, {
    type: "reveal",
    distribution: entry.distribution,
  });
  run = transitionRun(run, { type: "resolve" });
  return { ...voyage, run };
}

test("10 points survives, 11 ends the voyage without credit or further advance", () => {
  let voyage = finish(
    createEndless(demoCatalog, () => 0),
    10
  );
  expect(endlessProgress(voyage)).toEqual({
    status: "active",
    streak: 1,
    distance: 50,
  });
  voyage = finish(nextEndless(voyage), 11);
  expect(endlessProgress(voyage)).toEqual({
    status: "lost",
    streak: 1,
    distance: 50,
  });
  expect(() => nextEndless(voyage)).toThrow(/ended/i);
});

test("every eligible question can be reached once, with completion distinct from loss", () => {
  let voyage = createEndless(demoCatalog, () => 0.4);
  const seen: string[] = [];
  while (endlessProgress(voyage).status === "active") {
    if (voyage.run.round.phase !== "answering")
      throw new Error("Expected question");
    seen.push(voyage.run.round.question.id);
    voyage = finish(voyage, 0);
    if (endlessProgress(voyage).status === "active")
      voyage = nextEndless(voyage);
  }
  expect(seen).toHaveLength(40);
  expect(new Set(seen).size).toBe(40);
  expect(endlessProgress(voyage)).toEqual({
    status: "exhausted",
    streak: 40,
    distance: 4000,
  });
  expect(() => nextEndless(voyage)).toThrow(/ended/i);
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

test("restart resets the current streak and distance while preserving browser bests", () => {
  const storage = memoryStorage();
  const repository = createEndlessRepository(storage, demoCatalog, () => 0);
  let voyage = repository.load().voyage;
  voyage = finish(voyage, 0);
  expect(repository.save(voyage)).toEqual({ streak: 1, distance: 100 });
  voyage = finish(nextEndless(voyage), 11);
  repository.save(voyage);
  const restored = createEndlessRepository(
    storage,
    demoCatalog,
    () => 0.5
  ).load();
  expect(endlessProgress(restored.voyage).status).toBe("lost");
  const restarted = createEndless(demoCatalog, () => 0.5);
  expect(repository.save(restarted)).toEqual({ streak: 1, distance: 100 });
  const again = createEndlessRepository(storage, demoCatalog, () => 0).load();
  expect(endlessProgress(again.voyage)).toEqual({
    status: "active",
    streak: 0,
    distance: 0,
  });
  expect(again.best).toEqual({ streak: 1, distance: 100 });
});

test("reload preserves input and settles a pinned locked answer exactly once", () => {
  const storage = memoryStorage();
  const repository = createEndlessRepository(storage, demoCatalog, () => 0);
  let voyage = repository.load().voyage;
  let run = transitionRun(voyage.run, { type: "choose_answer", answer: "no" });
  run = transitionRun(run, {
    type: "aim",
    percentage: voyage.questions[0].distribution.yesPercentage,
  });
  voyage = { ...voyage, run };
  repository.save(voyage);
  const resumed = createEndlessRepository(
    storage,
    demoCatalog,
    () => 0.9
  ).load();
  expect(resumed.voyage.run.round).toEqual(run.round);
  repository.save({ ...voyage, run: transitionRun(run, { type: "lock" }) });
  for (let index = 0; index < 2; index++) {
    const restored = createEndlessRepository(
      storage,
      { ...demoCatalog, entries: [] },
      () => 0.9
    ).load();
    expect(restored.voyage.run.round.phase).toBe("resolved");
    expect(endlessProgress(restored.voyage)).toEqual({
      status: "active",
      streak: 1,
      distance: 100,
    });
    expect(restored.best).toEqual({ streak: 1, distance: 100 });
  }
});

test("exhaustion survives reload and an empty eligible pool completes without a loss", () => {
  const catalog = { ...demoCatalog, entries: demoCatalog.entries.slice(0, 1) };
  const storage = memoryStorage();
  const repository = createEndlessRepository(storage, catalog, () => 0);
  repository.save(finish(repository.load().voyage, 0));
  expect(
    endlessProgress(
      createEndlessRepository(storage, catalog, () => 0).load().voyage
    )
  ).toEqual({ status: "exhausted", streak: 1, distance: 100 });
  expect(
    endlessProgress(createEndless({ ...catalog, entries: [] }, () => 0)).status
  ).toBe("exhausted");
});

test("stale tabs cannot overwrite a restarted voyage or its bests", () => {
  const storage = memoryStorage();
  const first = createEndlessRepository(storage, demoCatalog, () => 0);
  const voyage = first.load().voyage;
  const other = createEndlessRepository(storage, demoCatalog, () => 0);
  other.load();
  first.save(finish(voyage, 0));
  expect(() => other.save(createEndless(demoCatalog, () => 0))).toThrow(
    /another tab/i
  );
});

test("corrupt progress fails safely instead of restarting or accepting stored scores", () => {
  const storage = memoryStorage();
  const repository = createEndlessRepository(storage, demoCatalog, () => 0);
  repository.load();
  const raw = JSON.parse(storage.getItem("offcourse:endless:v1")!);
  raw.predictions = [{ answer: "yes", percentage: 101 }];
  storage.setItem("offcourse:endless:v1", JSON.stringify(raw));
  expect(() =>
    createEndlessRepository(storage, demoCatalog, () => 0).load()
  ).toThrow();
});

test("best distance and best streak retain independent high-water marks", () => {
  const repository = createEndlessRepository(
    memoryStorage(),
    demoCatalog,
    () => 0
  );
  let voyage = repository.load().voyage;
  for (let index = 0; index < 3; index++) {
    voyage = finish(voyage, 10);
    repository.save(voyage);
    if (index < 2) voyage = nextEndless(voyage);
  }
  voyage = createEndless(demoCatalog, () => 0);
  repository.save(voyage);
  voyage = finish(voyage, 0);
  voyage = finish(nextEndless(voyage), 0);
  expect(repository.save(voyage)).toEqual({ streak: 3, distance: 200 });
});

test("missing the final available question is still a loss", () => {
  const voyage = createEndless(
    { ...demoCatalog, entries: demoCatalog.entries.slice(0, 1) },
    () => 0
  );
  expect(endlessProgress(finish(voyage, 11))).toEqual({
    status: "lost",
    streak: 0,
    distance: 0,
  });
});
