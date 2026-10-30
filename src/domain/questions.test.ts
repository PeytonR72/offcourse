import { describe, expect, it } from "vitest";
import {
  selectDailyDemo,
  selectEndlessDemo,
  type DemoCatalog,
  type QuestionSnapshot,
} from "./questions";

function snapshot(id: string): QuestionSnapshot {
  return {
    question: {
      id,
      prompt: `Would you visit destination ${id}?`,
      yesLabel: "Yes",
      noLabel: "No",
      category: "space",
      status: "published",
      sourceType: "simulated",
      distributionId: `${id}-v1`,
    },
    distribution: {
      id: `${id}-v1`,
      questionId: id,
      yesPercentage: 60,
      sampleSize: 0,
      frozenAt: "2026-10-29T00:00:00Z",
      eligibilityStatus: "ineligible",
      version: 1,
    },
  };
}

const catalog: DemoCatalog = {
  version: 1,
  label: "Illustrative results",
  entries: ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"].map(snapshot),
};

it.each([0, -1, 1.5, NaN])("rejects invalid catalog version %s", (version) => {
  const input = { ...catalog, version };
  expect(() =>
    selectDailyDemo(input, new Date("2026-10-29T00:00:00Z"))
  ).toThrow("Catalog version");
  expect(() => selectEndlessDemo(input, [], () => 0)).toThrow(
    "Catalog version"
  );
});

it.each(["daily", "endless"])(
  "pins %s selections independently of later caller edits",
  (mode) => {
    const entries = catalog.entries.map(({ question, distribution }) => ({
      question: { ...question },
      distribution: { ...distribution },
    }));
    const input = { ...catalog, entries };
    const result =
      mode === "daily"
        ? selectDailyDemo(input, new Date("2026-10-29T00:00:00Z"))
        : selectEndlessDemo(input, [], () => 0);
    const selected =
      result.status === "ready"
        ? result.questions[0]
        : result.status === "question"
          ? result.entry
          : undefined;
    if (!selected) throw new Error("Expected selected content");
    const originalPrompt = selected.question.prompt;
    for (const entry of entries) {
      entry.question.prompt = "Changed after scheduling";
      entry.distribution.yesPercentage = 1;
    }
    expect(selected.question.prompt).toBe(originalPrompt);
    expect(selected.distribution.yesPercentage).toBe(60);
    expect(() =>
      Object.assign(selected.question, { prompt: "Changed" })
    ).toThrow();
    expect(() =>
      Object.assign(selected.distribution, { yesPercentage: 2 })
    ).toThrow();
    expect(() =>
      Object.assign(selected, { distribution: snapshot("other").distribution })
    ).toThrow();
    expect(() => Object.assign(result, { label: "Real results" })).toThrow();
    if (result.status === "ready") {
      expect(() =>
        Object.assign(result.questions, { 0: snapshot("other") })
      ).toThrow();
    }
  }
);

describe("endless demo selection", () => {
  it("uses the injected draw after removing seen, invalid, and ambiguous identities", () => {
    const invalid = snapshot("invalid");
    const input = {
      ...catalog,
      entries: [
        ...catalog.entries,
        snapshot("q2"),
        {
          ...invalid,
          distribution: { ...invalid.distribution, yesPercentage: -1 },
        },
      ],
    };
    const seen = ["q1", "q1", "unknown"];
    expect(selectEndlessDemo(input, seen, () => 0)).toMatchObject({
      status: "question",
      entry: { question: { id: "q3" } },
    });
    expect(selectEndlessDemo(input, seen, () => 0.999999)).toMatchObject({
      status: "question",
      entry: { question: { id: "q8" } },
    });
    expect(seen).toEqual(["q1", "q1", "unknown"]);
  });

  it("reports exhaustion for an empty or entirely invalid pool", () => {
    const invalid = snapshot("invalid");
    for (const entries of [
      [],
      [
        {
          ...invalid,
          question: { ...invalid.question, status: "retired" as const },
        },
      ],
    ]) {
      expect(
        selectEndlessDemo({ ...catalog, entries }, [], () => 0)
      ).toMatchObject({
        status: "exhausted",
        reason: "pool_exhausted",
      });
    }
  });

  it.each([-0.1, 1, NaN, Infinity])(
    "rejects an invalid random draw of %s",
    (draw) => {
      expect(() => selectEndlessDemo(catalog, [], () => draw)).toThrow(
        "Random draw"
      );
    }
  );

  it("visits every question once and then explicitly completes the pool", () => {
    const seen: string[] = [];
    for (let round = 0; round < 8; round++) {
      const selection = selectEndlessDemo(catalog, seen, () => 0);
      expect(selection.label).toBe("Illustrative results");
      if (selection.status !== "question")
        throw new Error("Pool exhausted too early");
      expect(seen).not.toContain(selection.entry.question.id);
      seen.push(selection.entry.question.id);
    }
    expect(seen).toEqual(["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"]);
    expect(
      selectEndlessDemo(catalog, seen, () => {
        throw new Error("Exhaustion needs no random draw");
      })
    ).toEqual({
      label: "Illustrative results",
      status: "exhausted",
      reason: "pool_exhausted",
    });
  });
});

describe("daily demo selection", () => {
  it("reports insufficient content without issuing a partial daily", () => {
    for (const count of [0, 4]) {
      const result = selectDailyDemo(
        { ...catalog, entries: catalog.entries.slice(0, count) },
        new Date("2026-10-29T00:00:00Z")
      );
      expect(result).toEqual({
        status: "unavailable",
        reason: "insufficient_questions",
        availableQuestionCount: count,
        dateKey: "2026-10-29",
        catalogVersion: 1,
        label: "Illustrative results",
      });
    }
  });

  it("rejects an invalid clock value instead of choosing a fallback date", () => {
    expect(() => selectDailyDemo(catalog, new Date(NaN))).toThrow();
  });

  it("fails closed on repeated question identities and conflicting distribution identities", () => {
    const first = snapshot("q1");
    const second = snapshot("q2");
    const conflicting = {
      question: { ...second.question, distributionId: first.distribution.id },
      distribution: { ...second.distribution, id: first.distribution.id },
    };
    for (const entries of [
      [...catalog.entries.slice(0, 4), first],
      [first, conflicting, ...catalog.entries.slice(2, 5)],
    ]) {
      expect(
        selectDailyDemo(
          { ...catalog, entries },
          new Date("2026-10-29T00:00:00Z")
        )
      ).toMatchObject({
        status: "unavailable",
        availableQuestionCount: 3,
      });
    }
  });

  it("excludes invalid, unpublished, mismatched, and non-demo snapshots", () => {
    const base = snapshot("invalid");
    const invalid: QuestionSnapshot[] = [
      { ...base, question: { ...base.question, prompt: " " } },
      { ...base, question: { ...base.question, status: "draft" } },
      { ...base, question: { ...base.question, status: "retired" } },
      { ...base, question: { ...base.question, sourceType: "first_party" } },
      {
        ...base,
        question: { ...base.question, sourceType: "licensed_external" },
      },
      { ...base, question: { ...base.question, distributionId: "missing" } },
      { ...base, distribution: { ...base.distribution, questionId: "other" } },
      { ...base, distribution: { ...base.distribution, yesPercentage: 101 } },
      { ...base, distribution: { ...base.distribution, version: 0 } },
      {
        ...base,
        distribution: { ...base.distribution, frozenAt: "yesterday" },
      },
      {
        ...base,
        distribution: { ...base.distribution, eligibilityStatus: "eligible" },
      },
      { ...base, distribution: { ...base.distribution, sampleSize: 100 } },
    ];
    for (const entry of invalid) {
      const selection = selectDailyDemo(
        { ...catalog, entries: [...catalog.entries.slice(0, 4), entry] },
        new Date("2026-10-29T00:00:00Z")
      );
      expect(selection).toMatchObject({
        status: "unavailable",
        reason: "insufficient_questions",
        availableQuestionCount: 4,
      });
      expect(selection).not.toHaveProperty("questions");
    }
  });

  it("changes its schedule at UTC rollover and for a new catalog version", () => {
    const before = selectDailyDemo(
      catalog,
      new Date("2026-10-29T16:59:59-07:00")
    );
    const after = selectDailyDemo(
      catalog,
      new Date("2026-10-29T17:00:00-07:00")
    );
    const revised = selectDailyDemo(
      { ...catalog, version: 2 },
      new Date("2026-10-29T00:00:00Z")
    );
    expect(after.dateKey).toBe("2026-10-30");
    if (
      before.status !== "ready" ||
      after.status !== "ready" ||
      revised.status !== "ready"
    ) {
      throw new Error("Expected Daily Five");
    }
    expect(after.questions).not.toEqual(before.questions);
    expect(revised.questions).not.toEqual(before.questions);
  });

  it("pins five distinct questions to the UTC day and catalog version", () => {
    const selection = selectDailyDemo(
      catalog,
      new Date("2026-10-29T00:00:00Z")
    );
    expect(selection).toMatchObject({
      status: "ready",
      dateKey: "2026-10-29",
      catalogVersion: 1,
      label: "Illustrative results",
    });
    if (selection.status !== "ready") throw new Error("Expected Daily Five");
    expect(selection.questions).toHaveLength(5);
    expect(
      new Set(selection.questions.map(({ question }) => question.id)).size
    ).toBe(5);
    expect(
      selectDailyDemo(
        { ...catalog, entries: [...catalog.entries].reverse() },
        new Date("2026-10-29T16:59:59-07:00")
      )
    ).toEqual(selection);
    expect(catalog.entries.map(({ question }) => question.id)).toEqual([
      "q1",
      "q2",
      "q3",
      "q4",
      "q5",
      "q6",
      "q7",
      "q8",
    ]);
  });
});
