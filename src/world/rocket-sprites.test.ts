import { expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { rocketFrames, rocketSheetSvg } from "./rocket-art";
import { loadRocketSheet, rocketAppearance } from "./rocket-sprites";

test("expressions stay neutral before reveal, then celebrate or panic with the flight", () => {
  const neutral = {
    predictionOffset: 0,
    targetOffset: null,
    outcome: null,
  } as const;
  expect(rocketAppearance({ ...neutral, phase: "answering" }).expression).toBe(
    "idle"
  );
  expect(
    rocketAppearance({ ...neutral, phase: "locked", elapsed: 60 }).expression
  ).toBe("anticipation");
  expect(
    rocketAppearance({ ...neutral, phase: "flight", elapsed: 1100 }).expression
  ).toBe("idle");
  expect(
    rocketAppearance({
      ...neutral,
      phase: "reveal",
      targetOffset: 0,
      outcome: "perfect",
      elapsed: 1300,
    }).expression
  ).toBe("happy");
  expect(
    rocketAppearance({
      ...neutral,
      phase: "reveal",
      targetOffset: 0,
      outcome: "survive",
      elapsed: 1300,
    }).expression
  ).toBe("scared");
  expect(
    rocketAppearance({
      ...neutral,
      phase: "resolved",
      targetOffset: 0,
      outcome: "survive",
    }).expression
  ).toBe("happy");
  expect(
    rocketAppearance({
      ...neutral,
      phase: "reveal",
      targetOffset: 0,
      outcome: "miss",
      elapsed: 1300,
    }).expression
  ).toBe("tumble");
});

test("flight uses four complete thruster frames and shuts the engine off on settlement", () => {
  const state = {
    phase: "flight",
    predictionOffset: 0,
    targetOffset: null,
    outcome: null,
  } as const;
  const frames = [400, 480, 560, 640].map(
    (elapsed) => rocketAppearance({ ...state, elapsed }).thruster
  );
  expect(new Set(frames)).toEqual(
    new Set(["thrust-0", "thrust-1", "thrust-2", "thrust-3"])
  );
  for (const key of frames) {
    expect(key && rocketFrames[key].paths.length).toBeGreaterThan(0);
  }
  expect(
    rocketAppearance({
      ...state,
      phase: "resolved",
      targetOffset: 0,
      outcome: "perfect",
    }).thruster
  ).toBeNull();
  expect(readFileSync("public/art/rocket-v1.svg", "utf8").trim()).toBe(
    rocketSheetSvg()
  );
});

test("a missing or malformed sprite sheet recovers with complete embedded art", async () => {
  const requested: string[] = [];
  const sheet = await loadRocketSheet(async (url) => {
    requested.push(url);
    if (!url.startsWith("data:")) return { width: 1, height: 1 };
    return { width: 320, height: 80 };
  });
  expect(sheet.mode).toBe("embedded");
  const svg = new DOMParser().parseFromString(
    decodeURIComponent(requested[1].split(",")[1]),
    "image/svg+xml"
  );
  for (const name of [
    "idle",
    "anticipation",
    "happy",
    "scared",
    "tumble",
    "thrust-0",
    "thrust-1",
    "thrust-2",
    "thrust-3",
  ]) {
    expect(svg.getElementById(name)?.querySelector("path")).not.toBeNull();
  }
  const offline = await loadRocketSheet(async (url) => {
    if (!url.startsWith("data:")) throw new Error("offline");
    return { width: 320, height: 80 };
  });
  expect(offline.mode).toBe("embedded");
});
