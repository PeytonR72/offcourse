import { describe, expect, it } from "vitest";
import {
  validateDistribution,
  validateQuestion,
  type Distribution,
  type Question,
} from "./content";

const question: Question = {
  id: "q1",
  prompt: "Would you visit the Moon?",
  yesLabel: "Yes",
  noLabel: "No",
  category: "space",
  status: "published",
  sourceType: "simulated",
  distributionId: "d1",
};

const distribution: Distribution = {
  id: "d1",
  questionId: "q1",
  yesPercentage: 62.5,
  sampleSize: 0,
  frozenAt: "2026-10-29T00:00:00Z",
  eligibilityStatus: "ineligible",
  version: 1,
};

describe("content invariants", () => {
  it("accepts versioned simulated content without inventing votes", () => {
    expect(() => validateQuestion(question)).not.toThrow();
    expect(() => validateDistribution(distribution)).not.toThrow();
  });

  it.each([-1, 101, NaN, Infinity])(
    "rejects invalid crowd percentage %s",
    (value) => {
      expect(() =>
        validateDistribution({ ...distribution, yesPercentage: value })
      ).toThrow();
    }
  );

  it.each([0, 100, 62.5])("accepts crowd percentage %s", (value) => {
    expect(() =>
      validateDistribution({ ...distribution, yesPercentage: value })
    ).not.toThrow();
  });

  it("rejects missing question identity and text", () => {
    for (const field of [
      "id",
      "prompt",
      "yesLabel",
      "noLabel",
      "category",
      "distributionId",
    ]) {
      expect(() => validateQuestion({ ...question, [field]: " " })).toThrow();
    }
  });

  it("rejects invalid snapshot metadata", () => {
    for (const changes of [
      { id: "" },
      { questionId: "" },
      { version: 0 },
      { version: 1.5 },
      { sampleSize: -1 },
      { sampleSize: 1.5 },
      { frozenAt: "yesterday" },
      { frozenAt: "2026-10-29" },
      { sourceAttribution: " " },
    ]) {
      expect(() =>
        validateDistribution({ ...distribution, ...changes })
      ).toThrow();
    }
  });
});
