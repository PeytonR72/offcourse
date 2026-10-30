import type { Distribution } from "../domain/content";
import { transitionRun, type Run } from "../domain/run";

// One clock drives domain events and both renderers. Durations are presentation only.
export const flightTiming = {
  ignition: 130,
  flight: 330,
  approach: 1000,
  reveal: 1200,
  settled: 1800,
} as const;

/** Catch up in order, even after a suspended tab; resolution credits only once. */
export function advanceFlight(
  run: Run,
  distribution: Distribution,
  elapsed: number,
  action?: "skip" | "reduced"
): Run {
  if (
    action === "reduced" ||
    (action === "skip" && elapsed >= flightTiming.reveal)
  )
    elapsed = flightTiming.settled;
  if (run.round.phase === "locked" && elapsed >= flightTiming.ignition)
    run = transitionRun(run, { type: "launch" });
  if (run.round.phase === "flight" && elapsed >= flightTiming.reveal)
    run = transitionRun(run, { type: "reveal", distribution });
  if (run.round.phase === "reveal" && elapsed >= flightTiming.settled)
    run = transitionRun(run, { type: "resolve" });
  return run;
}
