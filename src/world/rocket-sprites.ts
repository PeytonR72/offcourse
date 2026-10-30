import { flightFrame } from "./flight-frame";
import type { SceneState } from "./scene-state";
import { rocketSheet, rocketSheetSvg } from "./rocket-art";

const thrusters = ["thrust-0", "thrust-1", "thrust-2", "thrust-3"] as const;

/** Expressions consume only the same public, spoiler-safe scene as flight. */
export function rocketAppearance(state: SceneState) {
  const frame = flightFrame(state);
  const expression =
    state.outcome === "miss"
      ? "tumble"
      : state.outcome === "perfect" ||
          (state.outcome === "survive" && frame.stage === "settled")
        ? "happy"
        : state.outcome === "survive"
          ? "scared"
          : frame.stage === "anticipation" || frame.stage === "ignition"
            ? "anticipation"
            : "idle";
  const thruster =
    frame.flame > 0
      ? thrusters[Math.floor((state.elapsed ?? 0) / 80) % thrusters.length]
      : null;
  return { expression, thruster } as const;
}

/** Image decoding is the external boundary; no Pixi cache owns this resource. */
export async function loadRocketSheet<
  T extends { width: number; height: number },
>(decode: (url: string) => Promise<T>) {
  try {
    const resource = await decode(rocketSheet.url);
    if (
      resource.width !== rocketSheet.width ||
      resource.height !== rocketSheet.height
    )
      throw new Error("Invalid rocket atlas dimensions");
    return { resource, mode: "asset" } as const;
  } catch {
    const resource = await decode(
      `data:image/svg+xml,${encodeURIComponent(rocketSheetSvg())}`
    );
    return { resource, mode: "embedded" } as const;
  }
}
