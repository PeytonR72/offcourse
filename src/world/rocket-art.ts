/** Original Offcourse pixel art. Integer paths are the editable source of the atlas. */
export const rocketTokens = {
  outline: "#192c40",
  cream: "#f8efd9",
  highlight: "#fff9e9",
  shade: "#c8c6b4",
  coral: "#eb8d7a",
  coralShade: "#b85e63",
  glass: "#57b9ca",
  glassShade: "#28758b",
  eyes: "#102b42",
  honey: "#f5c879",
  ember: "#e98959",
  scale: 1.5,
} as const;

type PixelPath = Readonly<{ fill: string; d: string }>;
export type RocketArtFrame = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
  paths: readonly PixelPath[];
}>;

const p = (fill: string, d: string): PixelPath => ({ fill, d });
const t = rocketTokens;

// The body faces right. Its porthole is a face, with two readable dark eyes.
const hull = [
  p(
    t.outline,
    "M28 3h8v3h4v3h10v2h4v3h4v3h3v6h-3v3h-4v2H40v3h-4v3h-8v-5h-6v-3h-7V14h7v-3h6Z"
  ),
  p(t.coralShade, "M30 5h4v3h4v5H28V9h2Z M28 26h10v3h-4v3h-4v-3h-2Z"),
  p(t.coral, "M30 5h4v4h-4Z M28 26h5v3h-3v2h-2Z"),
  p(t.cream, "M25 12h23v2h5v3h4v2h2v3h-4v3h-5v2H25v-3h-6V16h6Z"),
  p(t.shade, "M21 23h7v2h20v-1h7v-2h4v2h-5v3H25v-2h-4Z"),
  p(t.highlight, "M26 13h18v2H27v2h-5v-2h4Z"),
  p(t.coral, "M48 14h5v3h4v2h2v3h-4v2h-4v-3h2v-3h-5Z"),
  p(t.outline, "M14 16h6v9h-6Z"),
  p(t.shade, "M15 17h3v7h-3Z"),
  p(t.honey, "M14 19h2v3h-2Z"),
  p(t.outline, "M31 13h12v2h3v10h-3v2H31v-2h-3V15h3Z"),
  p(t.glassShade, "M31 15h12v2h1v6h-2v2H32v-2h-2v-6h1Z"),
  p(t.glass, "M32 15h10v2h2v5H31v-5h1Z"),
  p(t.highlight, "M32 15h3v2h-3Z"),
  p(t.coralShade, "M23 20h2v2h-2Z M25 20h2v2h-2Z"),
];

const faces = {
  idle: [
    p(t.eyes, "M33 18h2v4h-2Z M39 18h2v4h-2Z"),
    p(t.highlight, "M33 18h1v1h-1Z M39 18h1v1h-1Z"),
  ],
  anticipation: [
    p(t.eyes, "M32 18h4v2h-2v2h-2Z M38 18h4v2h-2v2h-2Z M36 23h3v1h-3Z"),
  ],
  happy: [
    p(
      t.eyes,
      "M32 19h1v-1h2v1h1v2h-1v-1h-2v1h-1Z M38 19h1v-1h2v1h1v2h-1v-1h-2v1h-1Z M35 22h5v1h-1v1h-3v-1h-1Z"
    ),
  ],
  scared: [
    p(t.highlight, "M32 17h4v6h-4Z M38 17h4v6h-4Z"),
    p(t.eyes, "M33 18h2v4h-2Z M39 18h2v4h-2Z M36 23h3v2h-3Z"),
    p(t.glass, "M44 12h2v2h1v2h-4v-2h1Z"),
  ],
  tumble: [
    p(
      t.eyes,
      "M32 18h1v1h1v-1h1v1h-1v1h1v1h-1v-1h-1v1h-1v-1h1v-1h-1Z M39 18h1v1h1v-1h1v1h-1v1h1v1h-1v-1h-1v1h-1v-1h1v-1h-1Z M35 23h2v-1h3v1h-2v1h-3Z"
    ),
  ],
} as const;

function cell(
  x: number,
  y: number,
  paths: readonly PixelPath[]
): RocketArtFrame {
  return { x: x * 64, y: y * 40, width: 64, height: 40, paths };
}

function thrust(tip: number, fork: boolean) {
  return [
    p(t.ember, `M14 16v9h-4v-2H6v-2H${tip}v-2h6v-2h4v-1Z`),
    p(t.honey, `M14 18v5h-4v-1H${fork ? 5 : 7}v-2h3v-2Z`),
    p(t.highlight, "M14 19v3h-4v-1H8v-1h3v-1Z"),
  ];
}

export const rocketFrames = {
  idle: cell(0, 0, [...hull, ...faces.idle]),
  anticipation: cell(1, 0, [...hull, ...faces.anticipation]),
  happy: cell(2, 0, [...hull, ...faces.happy]),
  scared: cell(3, 0, [...hull, ...faces.scared]),
  tumble: cell(4, 0, [...hull, ...faces.tumble]),
  "thrust-0": cell(0, 1, thrust(4, false)),
  "thrust-1": cell(1, 1, thrust(1, true)),
  "thrust-2": cell(2, 1, thrust(3, false)),
  "thrust-3": cell(3, 1, thrust(0, true)),
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
