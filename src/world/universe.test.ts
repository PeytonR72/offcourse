import { expect, test } from "vitest";
import { createUniverse, universeContext, universeOffsets } from "./universe";
import { createEndless, nextEndless } from "../domain/endless";
import { demoCatalog } from "../data/demo-questions";
import { transitionRun } from "../domain/run";
import { flightFrame } from "./flight-frame";
import { toSceneState } from "./scene-state";

test("a frozen question seed reproduces scenery with bounded decoration outside the flight corridor", () => {
  const layout = createUniverse("demo-01", 0);
  expect(createUniverse("demo-01", 0)).toEqual(layout);
  expect(createUniverse("demo-02", 0)).not.toEqual(layout);
  expect(layout.stars).toHaveLength(64);
  expect(layout.planets).toHaveLength(3);
  expect(layout.debris).toHaveLength(8);
  for (const item of [...layout.planets, ...layout.debris]) {
    expect(item.y - item.radius).toBeGreaterThanOrEqual(0);
    expect(item.y + item.radius).toBeLessThanOrEqual(196);
    expect(item.y + item.radius <= 44 || item.y - item.radius >= 172).toBe(
      true
    );
  }
});

test("regions follow only credited endless successes at 5, 15 and 30", () => {
  let voyage = createEndless(demoCatalog, () => 0);
  const regionAt: Record<number, string> = {
    0: "home",
    4: "home",
    5: "amber",
    14: "amber",
    15: "tidal",
    29: "tidal",
    30: "violet",
    40: "violet",
  };
  for (let completed = 0; completed <= 40; completed++) {
    const before = JSON.stringify(voyage.run);
    const context = universeContext(voyage.run);
    const universe = createUniverse(context.seed, context.streak);
    if (regionAt[completed])
      expect(universe.region.id).toBe(regionAt[completed]);
    expect(JSON.stringify(voyage.run)).toBe(before);
    const state = toSceneState(voyage.run.round);
    expect(flightFrame({ ...state, universe })).toEqual(flightFrame(state));
    expect(universeContext({ ...voyage.run, mode: "daily" }).streak).toBe(0);
    if (completed === 40) break;
    const entry = voyage.questions[completed];
    let run = transitionRun(voyage.run, {
      type: "choose_answer",
      answer: "yes",
    });
    run = transitionRun(run, {
      type: "aim",
      percentage: entry.distribution.yesPercentage,
    });
    run = transitionRun(run, { type: "lock" });
    run = transitionRun(run, { type: "launch" });
    expect(universeContext(run)).toEqual(context);
    run = transitionRun(run, {
      type: "reveal",
      distribution: entry.distribution,
    });
    expect(universeContext(run)).toEqual(context);
    run = transitionRun(run, { type: "resolve" });
    expect(run.totalDistance).toBe((completed + 1) * 100);
    voyage = { ...voyage, run };
    if (completed < 39) voyage = nextEndless(voyage);
  }
});

test("parallax moves nearby debris faster than distant layers without changing vertical safe areas", () => {
  expect(universeOffsets(0)).toEqual({ far: 0, near: 0, debris: 0 });
  expect(universeOffsets(400)).toEqual({ far: -10, near: -32, debris: -72 });
});
