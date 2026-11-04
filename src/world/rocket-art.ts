/**
 * Original Offcourse pixel art. The character grids below are the editable
 * source of the atlas: one character per pixel, "." is transparent, and every
 * other character names a palette token. Faces and flames are overlays.
 */
export const rocketTokens = {
  outline: "#192c40",
  cream: "#f8efd9",
  highlight: "#fff9e9",
  shade: "#d9d3c0",
  shadeDeep: "#b3ae9f",
  coral: "#eb8d7a",
  coralLight: "#f6b3a1",
  coralShade: "#b85e63",
  coralDeep: "#8f4652",
  steel: "#9db2c3",
  steelShade: "#5f7689",
  visor: "#7fd3df",
  glass: "#57b9ca",
  glassShade: "#28758b",
  eyes: "#102b42",
  blush: "#f29a8e",
  honey: "#f5c879",
  ember: "#e98959",
  scale: 1.5,
} as const;

const t = rocketTokens;
const palette: Readonly<Record<string, string>> = {
  O: t.outline,
  C: t.cream,
  H: t.highlight,
  W: t.highlight,
  S: t.shade,
  D: t.shadeDeep,
  R: t.coral,
  K: t.coralLight,
  r: t.coralShade,
  q: t.coralDeep,
  M: t.steel,
  N: t.steelShade,
  L: t.visor,
  G: t.glass,
  g: t.glassShade,
  E: t.eyes,
  B: t.blush,
  Y: t.honey,
  F: t.ember,
};

type PixelPath = Readonly<{ fill: string; d: string }>;
type PixelGrid = Readonly<{ x: number; y: number; rows: readonly string[] }>;
export type RocketArtFrame = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
  paths: readonly PixelPath[];
}>;

/** One path per color, built from horizontal pixel runs. */
function toPaths(...grids: readonly PixelGrid[]): PixelPath[] {
  const pixels = new Map<string, string>();
  for (const { x, y, rows } of grids)
    rows.forEach((row, dy) =>
      [...row].forEach((key, dx) => {
        if (key !== ".") pixels.set(`${x + dx},${y + dy}`, key);
      })
    );
  const runs = new Map<string, string[]>();
  for (let y = 0; y < 40; y++)
    for (let x = 0; x < 64;) {
      const key = pixels.get(`${x},${y}`);
      if (!key) {
        x++;
        continue;
      }
      let end = x + 1;
      while (pixels.get(`${end},${y}`) === key) end++;
      const fill = palette[key];
      if (!fill) throw new Error(`Unknown rocket pixel "${key}"`);
      runs.set(fill, [
        ...(runs.get(fill) ?? []),
        `M${x} ${y}h${end - x}v1H${x}Z`,
      ]);
      x = end;
    }
  return [...runs].map(([fill, parts]) => ({ fill, d: parts.join("") }));
}

// The ship faces right. Its porthole is a face with two readable dark eyes.
const hullGrid = {
  x: 0,
  y: 4,
  rows: [
    "................................................................",
    "..................OOOO..........................................",
    ".................OKRRROO........................................",
    ".................OKRRRRROO......................................",
    "..................OKRRRRRROO....................................",
    "...................OKRRRRRRROO..................................",
    "....................OKRRRRRRRROO................................",
    ".....................OKRRRRRRRRROOOOOOOOOOOOOOOOOOOO............",
    "....................OHHHRHHHHHHHHHHHHHHHHHHHHHRRHKKKOOO.........",
    "...................OHHHHRHHHHHHHHMMMMMMMHHHHHHRRHKKKKKKOOO......",
    "..................OHHHHHRHHSHHHHMMOOOOOMMHHHSHRRHKKKKKKKKKO.....",
    ".................OOHHCCCRCCCCCCMMOWWWLLOMMCCCCRRCKKKKKKKKKRO....",
    "..............OOOMMHCCCCRCCCCCMMOWWWLLLLOMMCCCRRCRRRRRRKKKRRO...",
    ".............ONMMMMCCCCCRCCCCMMOWWWLLLLLLOMMCCRRCRRRRRRRRRRRRO..",
    ".............ONMMMMCCCCCRCCCCMOWWWLLLLLLLLOMCCRRCRRRRRRRRRRRRRO.",
    ".............ONMMMMCCCCCRCCCCMOWWLLLLLLLLLOMCCRRCRRRRRRRRRRRRRO.",
    ".............ONMMMMCCCCCRCCCCNOWLLLLLLLLLGOMCCRRCRRRRRRRRRRRRRO.",
    ".............ONMMMMCCCCCRCCCCNOLLLLLLLLLGGOMCCRRCrrrrrrrrrrrrrO.",
    ".............ONNNNNCCCCCrCCCCNOLLLLLLLLGGgOMCCrrCrrrrrrrrrrrrrO.",
    ".............ONNNNNCCCCCrCCCCNNOLLLLLLGGgOMMCCrrCrrrrrrrrrrrrO..",
    "..............OOONNSSCCCrCCCCCNNOLGGGGGgONNCCCrrCrrrrrrrrrrrO...",
    ".................OOSSSSSrSSSSSSNNOGggggONNSSSSrrSrrrrrrrrrrO....",
    "..................ODDSSSrSSSSSSSNNOOOOONNSSSSSrrSrrrrrrrrrO.....",
    "...................ODDDDrDDDDDDDDNNNNNNNDDDDDDrrDrrrrrrOOO......",
    "....................ODDDrDDDDDDDDDDDDDDDDDDDDDrrDrrrOOO.........",
    ".....................OrrrrrrrrqqOOOOOOOOOOOOOOOOOOOO............",
    "....................OrrrrrrrqqOO................................",
    "...................OrrrrrrqqOO..................................",
    "..................OrrrrrqqOO....................................",
    ".................OrrrrqqOO......................................",
    ".................OrrqqOO........................................",
    "..................OOOO..........................................",
    "................................................................",
  ],
} as const;
const faceGrids = {
  idle: {
    x: 30,
    y: 12,
    rows: [
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "...WE...WE......",
      "...EE...EE......",
      "...EE...EE......",
      "................",
      "..B..E.E..B.....",
      "......E.........",
      "................",
      "................",
      "................",
    ],
  },
  anticipation: {
    x: 30,
    y: 12,
    rows: [
      "................",
      "................",
      "................",
      "................",
      "................",
      "..EE.....EE.....",
      "....E...E.......",
      "...WE...WE......",
      "...EE...EE......",
      "................",
      "................",
      ".....EEE........",
      "................",
      "................",
      "................",
    ],
  },
  happy: {
    x: 30,
    y: 12,
    rows: [
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "...EE...EE......",
      "..E..E.E..E.....",
      "................",
      "..B.EKKKE.B.....",
      ".....EEE........",
      "................",
      "................",
      "................",
      "................",
    ],
  },
  scared: {
    x: 30,
    y: 12,
    rows: [
      "................",
      "...............L",
      "..............GG",
      "................",
      "................",
      "..WWW...WWW.....",
      "..WEW...WEW.....",
      "..WWW...WWW.....",
      "................",
      "................",
      ".....EEE........",
      ".....EEE........",
      "................",
      "................",
      "................",
    ],
  },
  tumble: {
    x: 30,
    y: 12,
    rows: [
      "................",
      "................",
      "................",
      "................",
      "................",
      "................",
      "..E.E...E.E.....",
      "...E.....E......",
      "..E.E...E.E.....",
      "................",
      ".....E.E........",
      "....E.E.E.......",
      "................",
      "................",
      "................",
    ],
  },
} as const;

const thrustGrids = [
  {
    x: 0,
    y: 16,
    rows: [
      "...........FFF",
      "........FFYYYY",
      ".....FFFYYYWWW",
      "...FFFFYYYWWWW",
      "..FFFFYYYYWWWW",
      "...FFFFYYYWWWW",
      ".....FFFYYYWWW",
      "........FFYYYY",
      "...........FFF",
    ],
  },
  {
    x: 0,
    y: 16,
    rows: [
      ".........FFFFF",
      "......FFFYYYYY",
      "....FFFYYYYWWW",
      ".FFFFYYYYYWWWW",
      "...FFFFYYYWWWW",
      ".FFFFYYYYYWWWW",
      "....FFFYYYYWWW",
      "......FFFYYYYY",
      ".........FFFFF",
    ],
  },
  {
    x: 0,
    y: 16,
    rows: [
      "............FF",
      ".........FYYYY",
      "......FFFYYWWW",
      "....FFFYYYYWWW",
      "...FFFFYYYWWWW",
      "....FFFYYYYWWW",
      "......FFFYYWWW",
      ".........FYYYY",
      "............FF",
    ],
  },
  {
    x: 0,
    y: 16,
    rows: [
      "..........FFFF",
      ".....FFFYYYYYY",
      "...FFFFYYYWWWW",
      "..FFFFYYYYWWWW",
      "FFFFFYYYYWWWWW",
      "..FFFFYYYYWWWW",
      "...FFFFYYYWWWW",
      ".....FFFYYYYYY",
      "..........FFFF",
    ],
  },
] as const;

function cell(
  x: number,
  y: number,
  paths: readonly PixelPath[]
): RocketArtFrame {
  return { x: x * 64, y: y * 40, width: 64, height: 40, paths };
}

const ship = (face: keyof typeof faceGrids) =>
  toPaths(hullGrid, faceGrids[face]);

export const rocketFrames = {
  idle: cell(0, 0, ship("idle")),
  anticipation: cell(1, 0, ship("anticipation")),
  happy: cell(2, 0, ship("happy")),
  scared: cell(3, 0, ship("scared")),
  tumble: cell(4, 0, ship("tumble")),
  "thrust-0": cell(0, 1, toPaths(thrustGrids[0])),
  "thrust-1": cell(1, 1, toPaths(thrustGrids[1])),
  "thrust-2": cell(2, 1, toPaths(thrustGrids[2])),
  "thrust-3": cell(3, 1, toPaths(thrustGrids[3])),
} as const;
export type RocketFrameKey = keyof typeof rocketFrames;

export const rocketSheet = {
  url: "/art/rocket-v1.svg",
  width: 320,
  height: 80,
} as const;

/** Used for the committed atlas and as an offline fallback from the same source. */
export function rocketSheetSvg() {
  const cells = Object.entries(rocketFrames)
    .map(
      ([name, frame]) =>
        `<g id="${name}" transform="translate(${frame.x} ${frame.y})">${frame.paths.map(({ fill, d }) => `<path fill="${fill}" d="${d}"/>`).join("")}</g>`
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="80" viewBox="0 0 320 80" shape-rendering="crispEdges"><title>Offcourse original rocket — five expressions and four thrusters</title>${cells}</svg>`;
}
