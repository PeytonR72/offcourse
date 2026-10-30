import { afterEach, expect, test, vi } from "vitest";
import { createBrowserStorage } from "./browser-storage";
import { createDailyRepository } from "./daily-repository";
import { demoCatalog } from "../data/demo-questions";
import { transitionRun } from "./run";

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

test("blocked localStorage falls back to session memory and preserves daily input", () => {
  const storage = createBrowserStorage(() => {
    throw new Error("Denied");
  });
  const repository = createDailyRepository(
    storage,
    demoCatalog,
    () => new Date("2026-10-29T12:00:00Z")
  );
  const daily = repository.load();
  const run = transitionRun(daily.run, { type: "choose_answer", answer: "no" });
  repository.save({ ...daily, run });
  expect(repository.load().run).toEqual(run);
  expect(storage.persistent).toBe(false);
});

test("a later write failure preserves restored progress in session memory", () => {
  const storage = createBrowserStorage(() => localStorage);
  const repository = createDailyRepository(
    storage,
    demoCatalog,
    () => new Date("2026-10-29T12:00:00Z")
  );
  const daily = repository.load();
  expect(storage.persistent).toBe(true);
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("Quota exceeded");
  });
  const run = transitionRun(daily.run, {
    type: "choose_answer",
    answer: "yes",
  });
  repository.save({ ...daily, run });
  expect(repository.load().run).toEqual(run);
  expect(storage.persistent).toBe(false);
});

test("read failure uses the last read record and corrupt stored data still fails safely", () => {
  localStorage.setItem("offcourse:daily:v1:2026-10-29", "broken json");
  const storage = createBrowserStorage(() => localStorage);
  expect(() =>
    createDailyRepository(
      storage,
      demoCatalog,
      () => new Date("2026-10-29T12:00:00Z")
    ).load()
  ).toThrow();
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("Denied");
  });
  expect(storage.getItem("offcourse:daily:v1:2026-10-29")).toBe("broken json");
  expect(storage.persistent).toBe(false);
});
