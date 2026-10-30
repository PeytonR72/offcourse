import type { Run } from "../domain/run";

const regions = [
  {
    id: "home",
    name: "Home orbit",
    sky: 0x0d1928,
    haze: 0x243d57,
    planet: 0x638595,
    accent: 0xa8cad0,
  },
  {
    id: "amber",
    name: "Amber shoals",
    sky: 0x201b2b,
    haze: 0x62414f,
    planet: 0xc18a68,
    accent: 0xf1cc8d,
  },
  {
    id: "tidal",
    name: "Tidal nebula",
    sky: 0x10252e,
    haze: 0x255766,
    planet: 0x64a6a4,
    accent: 0xafe0cc,
  },
  {
    id: "violet",
    name: "Violet frontier",
    sky: 0x211b36,
    haze: 0x503b72,
    planet: 0x9b82bd,
    accent: 0xe0c8f1,
  },
] as const;

/** Decoration occupies the top/bottom margins, leaving trajectory and caption clear. */
export function createUniverse(seed: string, streak: number) {
  let value = 2166136261;
  for (const letter of seed)
    value = Math.imul(value ^ letter.charCodeAt(0), 16777619);
  const random = () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
  const decoration = (index: number, radius: number) => ({
    x: 150 + random() * 280,
    y: index % 2 === 0 ? 22 : 184,
    radius,
  });
  return {
    region: regions[streak >= 30 ? 3 : streak >= 15 ? 2 : streak >= 5 ? 1 : 0],
    stars: Array.from({ length: 64 }, (_, index) => ({
      x: random() * 640,
      y: random() * 224,
      radius: index % 7 === 0 ? 2 : 1,
      layer: index % 2,
    })),
    planets: Array.from({ length: 3 }, (_, index) => ({
      ...decoration(index, 7 + random() * 4),
      kind: (["ringed", "cratered", "striped"] as const)[index],
    })),
    debris: Array.from({ length: 8 }, (_, index) =>
      decoration(index, 1 + random() * 2)
    ),
  };
}

export type Universe = ReturnType<typeof createUniverse>;

/** Reads only question identity and already credited successes, never a hidden target. */
export function universeContext(run: Run) {
  const round = run.round;
  const question =
    "question" in round
      ? round.question
      : "lock" in round
        ? round.lock.question
        : "result" in round
          ? round.result.lock.question
          : null;
  return {
    seed: question?.id ?? "offcourse",
    streak:
      run.mode === "endless"
        ? run.completedRounds.filter(({ score }) => score.survived).length
        : 0,
  };
}

/** Uses the existing flight clock. No second animation loop or scoring events. */
export function universeOffsets(travel: number) {
  return {
    far: -travel * 0.025 || 0,
    near: -travel * 0.08 || 0,
    debris: -travel * 0.18 || 0,
  };
}

export const cssColor = (color: number) =>
  `#${color.toString(16).padStart(6, "0")}`;
