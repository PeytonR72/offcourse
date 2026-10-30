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
  if (
    !state.reducedMotion &&
    (state.phase === "answering" || state.phase === "aiming")
  ) {
    const breath = Math.sin((state.motionTime ?? 0) / 650);
    y += breath * 3;
    rotation += breath * 0.015;
    scaleX += breath * 0.015;
    scaleY -= breath * 0.015;
  }
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
    if (!state.reducedMotion) {
      flame *= 0.94 + Math.sin(elapsed / 37) * 0.1;
      const stretch = Math.sin(
        clamp((elapsed - timing.ignition) / (timing.flight - timing.ignition)) *
          Math.PI
      );
      scaleX += stretch * 0.1;
      scaleY -= stretch * 0.08;
    }
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
      if (!state.reducedMotion) {
        const squash = Math.sin(progress * Math.PI * 2) * (1 - progress) * 0.08;
        scaleX = 1 + squash;
        scaleY = 1 - squash;
      }
      rotation =
        state.outcome === "survive"
          ? Math.sin(progress * Math.PI * 4) * (1 - progress) * 0.25
          : 0;
    }
    if (progress === 1) stage = "settled";
  }
  const particles =
    !state.reducedMotion && flame > 0
      ? Array.from({ length: 7 }, (_, index) => {
          const age = ((state.elapsed ?? 0) / 450 + index / 7) % 1;
          const trail = 27 + age * 32;
          const spread = Math.sin(index * 2.4) * age * 7;
          return {
            x: x - Math.cos(rotation) * trail - Math.sin(rotation) * spread,
            y: y - Math.sin(rotation) * trail + Math.cos(rotation) * spread,
            radius: 1.5 - age * 0.8,
            alpha: (1 - age) * 0.55,
          };
        })
      : [];
  return { stage, x, y, rotation, scaleX, scaleY, alpha, flame, particles };
}
