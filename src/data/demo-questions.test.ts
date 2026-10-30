import { expect, it } from "vitest";
import { validateDistribution, validateQuestion } from "../domain/content";
import { demoCatalog } from "./demo-questions";
import { selectDailyDemo, selectEndlessDemo } from "../domain/questions";

it("supplies at least forty unique, valid, honestly labeled demo questions", () => {
  expect(demoCatalog.label).toBe("Illustrative results");
  expect(demoCatalog.version).toBe(1);
  expect(demoCatalog.entries.length).toBeGreaterThanOrEqual(40);
  const questionIds = new Set<string>();
  const prompts = new Set<string>();
  const distributionIds = new Set<string>();
  for (const { question, distribution } of demoCatalog.entries) {
    expect(() => validateQuestion(question)).not.toThrow();
    expect(() => validateDistribution(distribution)).not.toThrow();
    expect(question).toMatchObject({
      status: "published",
      sourceType: "simulated",
      yesLabel: "Yes",
      noLabel: "No",
      distributionId: distribution.id,
    });
    expect(distribution).toMatchObject({
      questionId: question.id,
      sampleSize: 0,
      eligibilityStatus: "ineligible",
      version: 1,
      sourceAttribution:
        "Simulated for the Offcourse demo; no votes collected.",
    });
    questionIds.add(question.id);
    prompts.add(question.prompt);
    distributionIds.add(distribution.id);
  }
  expect(questionIds.size).toBe(demoCatalog.entries.length);
  expect(prompts.size).toBe(demoCatalog.entries.length);
  expect(distributionIds.size).toBe(demoCatalog.entries.length);
});

it("makes the complete seed playable without repeats and serves a stable Daily Five", () => {
  const day = new Date("2026-10-29T00:00:00Z");
  const daily = selectDailyDemo(demoCatalog, day);
  expect(daily.status).toBe("ready");
  expect(
    selectDailyDemo(demoCatalog, new Date("2026-10-29T23:59:59Z"))
  ).toEqual(daily);
  const seen: string[] = [];
  for (let round = 0; round < 40; round++) {
    const result = selectEndlessDemo(demoCatalog, seen, () => 0.5);
    if (result.status !== "question")
      throw new Error("Seed pool exhausted too early");
    expect(seen).not.toContain(result.entry.question.id);
    seen.push(result.entry.question.id);
  }
  expect(selectEndlessDemo(demoCatalog, seen, () => 0)).toMatchObject({
    status: "exhausted",
    reason: "pool_exhausted",
  });
  expect(() => Object.assign(demoCatalog, { version: 2 })).toThrow();
  expect(() =>
    Object.assign(demoCatalog.entries[0].distribution, { yesPercentage: 0 })
  ).toThrow();
});
