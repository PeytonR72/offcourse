import { expect, test } from "vitest";
import { demoCatalog } from "../data/demo-questions";
import { createRun, transitionRun } from "../domain/run";
import { toSceneState } from "./scene-state";

test("aiming uses the YES axis and reveals no target until the run reveals", () => {
  const { question, distribution } = demoCatalog.entries[0];
  let run = transitionRun(createRun("scene", "daily"), {
    type: "start_round",
    roundId: question.id,
    question,
    distributionVersion: distribution.version,
  });
  expect(toSceneState(run.round)).toEqual({
    phase: "answering",
    predictionOffset: 0,
    targetOffset: null,
    outcome: null,
  });
  run = transitionRun(run, { type: "choose_answer", answer: "no" });
  run = transitionRun(run, { type: "aim", percentage: 0 });
  expect(toSceneState(run.round).predictionOffset).toBe(-1);
  run = transitionRun(run, { type: "aim", percentage: 100 });
  expect(toSceneState(run.round).predictionOffset).toBe(1);
  for (const type of ["lock", "launch"] as const) {
    run = transitionRun(run, { type });
    expect(toSceneState(run.round)).toEqual({
      phase: type === "lock" ? "locked" : "flight",
      predictionOffset: 1,
      targetOffset: null,
      outcome: null,
    });
  }
  run = transitionRun(run, { type: "reveal", distribution });
  expect(toSceneState(run.round).targetOffset).not.toBeNull();
  expect(toSceneState(run.round).outcome).not.toBeNull();
  run = transitionRun(run, { type: "resolve" });
  expect(toSceneState(run.round).phase).toBe("resolved");
});
