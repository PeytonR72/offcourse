import { flightTiming as timing } from "./flight";
import type { SceneState } from "./scene-state";

export function trajectoryGeometry(state: SceneState) {
  return {
    endY: 128 - state.predictionOffset * 78,
    targetY: 128 - (state.targetOffset ?? 0) * 78,
  };
}

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => value * value * (3 - 2 * value);
const revealPosition = 0.94;

function pointOnTrajectory(t: number, endY: number) {
  return {
    x: (1 - t) ** 2 * 86 + 2 * (1 - t) * t * 310 + t * t * 532,
    y: (1 - t) ** 2 * 166 + 2 * (1 - t) * t * 48 + t * t * endY,
  };
}

/** Shared by Pixi and the SVG fallback; never reads an unrevealed distribution. */
export function flightFrame(state: SceneState) {
  const { endY, targetY } = trajectoryGeometry(state);
  let stage = state.phase === "aiming" ? "aiming" : "idle";
  let x = 86,
    y = 166,
    rotation = -0.25 - state.predictionOffset * 0.08;
  let scaleX = 1,
    scaleY = 1,
    alpha = 1,
    flame = 0;
  if (state.phase === "locked") {
    stage = "anticipation";
    const squash = Math.sin(
      clamp((state.elapsed ?? 0) / timing.ignition) * Math.PI
    );
    scaleX = 1 - squash * 0.12;
    scaleY = 1 + squash * 0.12;
  }
  if (state.phase === "flight") {
    const elapsed = state.elapsed ?? timing.flight;
    stage =
      elapsed < timing.flight
        ? "ignition"
        : elapsed < timing.approach
          ? "flight"
          : "approach";
    flame = stage === "ignition" ? 1.5 : 1;
    const t =
      clamp((elapsed - timing.flight) / (timing.reveal - timing.flight)) *
      revealPosition;
    // A quadratic curve whose path depends only on the locked prediction.
    ({ x, y } = pointOnTrajectory(t, endY));
    rotation = Math.atan2(
      2 * (1 - t) * (48 - 166) + 2 * t * (endY - 48),
      2 * (1 - t) * (310 - 86) + 2 * t * (532 - 310)
    );
  }
  if (state.targetOffset !== null) {
    const progress =
      state.phase === "resolved"
        ? 1
        : clamp(
            ((state.elapsed ?? timing.reveal) - timing.reveal) /
              (timing.settled - timing.reveal)
          );
    const settling = ease(progress);
    const { x: startX, y: startY } = pointOnTrajectory(revealPosition, endY);
    if (state.outcome === "miss") {
      stage = "drift-out";
      x = startX + settling * 180;
      y = startY - settling * 90;
      rotation = settling * 1.8;
      alpha = 1 - settling;
    } else {
      stage = "landing";
      x = startX + (504 - startX) * settling;
      y = startY + (targetY - startY) * settling;
      if (state.outcome === "perfect") y -= Math.sin(progress * Math.PI) * 12;
      rotation =
        state.outcome === "survive"
          ? Math.sin(progress * Math.PI * 4) * (1 - progress) * 0.25
          : 0;
    }
    if (progress === 1) stage = "settled";
  }
  return { stage, x, y, rotation, scaleX, scaleY, alpha, flame };
}
