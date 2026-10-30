import { expect, test } from "vitest";
import { demoCatalog } from "../data/demo-questions";
import { createRun, transitionRun } from "../domain/run";
import { advanceFlight } from "./flight";
import { flightFrame } from "./flight-frame";
import { toSceneState } from "./scene-state";

const { question, distribution } = demoCatalog.entries[0];
function locked(guess = distribution.yesPercentage) {
  let run = transitionRun(createRun("flight", "daily"), {
    type: "start_round",
    roundId: question.id,
    question,
    distributionVersion: distribution.version,
  });
  run = transitionRun(run, { type: "choose_answer", answer: "no" });
  run = transitionRun(run, { type: "aim", percentage: guess });
  return transitionRun(run, { type: "lock" });
}

test("flight holds the immutable prediction and hides results until approach finishes", () => {
  const initial = locked();
  let run = advanceFlight(initial, distribution, 100);
  expect(run.round.phase).toBe("locked");
  run = advanceFlight(run, distribution, 200);
  expect(run.round.phase).toBe("flight");
  run = advanceFlight(run, distribution, 1100);
  expect(run.round.phase).toBe("flight");
  expect(run.completedRounds).toHaveLength(0);
  run = advanceFlight(run, distribution, 1200);
  expect(run.round.phase).toBe("reveal");
  expect(run.completedRounds).toHaveLength(0);
  run = advanceFlight(run, distribution, 1800);
  expect(run.round.phase).toBe("resolved");
  expect(run.completedRounds).toHaveLength(1);
  expect(run.totalDistance).toBe(100);
  expect(advanceFlight(run, distribution, 3000)).toBe(run);
  expect(initial.round.phase).toBe("locked");
});

test.each([
  { error: 0, outcome: "perfect", stage: "landing" },
  { error: 10, outcome: "survive", stage: "landing" },
  { error: 11, outcome: "miss", stage: "drift-out" },
])(
  "scene follows launch stages and the $outcome outcome without previewing accuracy",
  ({ error, outcome, stage }) => {
    const initial = locked(distribution.yesPercentage - error);
    for (const [elapsed, expected] of [
      [0, "anticipation"],
      [200, "ignition"],
      [700, "flight"],
      [1100, "approach"],
    ] as const) {
      const run = advanceFlight(initial, distribution, elapsed);
      const state = toSceneState(run.round, elapsed);
      expect(flightFrame(state).stage).toBe(expected);
      expect(state.targetOffset).toBeNull();
      expect(state.outcome).toBeNull();
    }
    const reveal = advanceFlight(initial, distribution, 1400);
    const state = toSceneState(reveal.round, 1400);
    expect(state.outcome).toBe(outcome);
    expect(flightFrame(state).stage).toBe(stage);
    const final = advanceFlight(reveal, distribution, 1800);
    const settled = flightFrame(toSceneState(final.round));
    expect(settled.stage).toBe("settled");
    expect(settled.alpha).toBe(outcome === "miss" ? 0 : 1);
    expect(flightFrame(toSceneState(final.round, 9999))).toEqual(settled);
  }
);

test.each([
  { error: 0, distance: 100, survived: true },
  { error: 10, distance: 50, survived: true },
  { error: 11, distance: 45, survived: false },
])(
  "skip and reduced motion preserve the $error-point result and credit once",
  ({ error, distance, survived }) => {
    const initial = locked(distribution.yesPercentage - error);
    // Skip is deliberately unavailable before the reveal trigger.
    expect(advanceFlight(initial, distribution, 500, "skip").round.phase).toBe(
      "flight"
    );
    const revealed = advanceFlight(initial, distribution, 1200);
    const skipped = advanceFlight(revealed, distribution, 1250, "skip");
    const reduced = advanceFlight(initial, distribution, 0, "reduced");
    const normal = advanceFlight(initial, distribution, 1800);
    expect(skipped).toEqual(normal);
    expect(reduced).toEqual(normal);
    expect(normal.totalDistance).toBe(distance);
    expect(normal.completedRounds[0].score.survived).toBe(survived);
    expect(advanceFlight(skipped, distribution, 2000, "skip")).toBe(skipped);
  }
);
