import { mkdir, writeFile } from "node:fs/promises";
import { rocketSheetSvg } from "../src/world/rocket-art.ts";

await mkdir(new URL("../public/art/", import.meta.url), { recursive: true });
await writeFile(
  new URL("../public/art/rocket-v1.svg", import.meta.url),
  rocketSheetSvg() + "\n"
);
