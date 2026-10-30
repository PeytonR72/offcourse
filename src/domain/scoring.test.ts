import { describe, expect, it } from "vitest";
import { scoreRound } from "./scoring";

describe("round scoring", () => {
  it.each([-1, 101, 0.5, NaN, Infinity])(
    "rejects invalid player guess %s",
    (guess) => {
      expect(() => scoreRound("daily", guess, 50)).toThrow();
    }
  );

  it.each([-1, 101, NaN, Infinity])(
    "rejects invalid crowd percentage %s",
    (actual) => {
      expect(() => scoreRound("daily", 50, actual)).toThrow();
    }
  );

  it.each([
    ["daily", 60, 62.5, 2.5, true, 88],
    ["endless", 60, 70.01, 10.01, false, 0],
    ["endless", 50, 60, 10, true, 50],
  ] as const)(
    "rounds distance without rounding the %s survival judgment",
    (mode, guess, actual, error, survived, distance) => {
      const score = scoreRound(mode, guess, actual);
      expect(score.error).toBeCloseTo(error);
      expect(score.survived).toBe(survived);
      expect(score.distance).toBe(distance);
    }
  );

  it.each([
    [0, true, 100],
    [1, true, 95],
    [9, true, 55],
    [10, true, 50],
    [11, false, 0],
    [20, false, 0],
    [100, false, 0],
  ])(
    "credits only surviving endless rounds at %s error",
    (error, survived, distance) => {
      expect(scoreRound("endless", error, 0)).toEqual({
        error,
        survived,
        distance,
      });
    }
  );

  it("awards 100 light-years for an exact prediction", () => {
    expect(scoreRound("daily", 60, 60)).toEqual({
      error: 0,
      survived: true,
      distance: 100,
    });
  });

  it.each([
    [1, true, 95],
    [9, true, 55],
    [10, true, 50],
    [11, false, 45],
    [20, false, 0],
    [100, false, 0],
  ])(
    "scores a daily error of %s percentage points",
    (error, survived, distance) => {
      expect(scoreRound("daily", error, 0)).toEqual({
        error,
        survived,
        distance,
      });
      expect(scoreRound("daily", 0, error)).toEqual({
        error,
        survived,
        distance,
      });
    }
  );
});
