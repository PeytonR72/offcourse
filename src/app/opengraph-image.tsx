import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Offcourse: a little rocket, a lot of humanity";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const font = await readFile(
    join(process.cwd(), "src/fonts/silkscreen-og.ttf")
  );
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "#091321",
        color: "#f8efd9",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        border: "24px solid #111f30",
      }}
    >
      <div
        style={{
          display: "flex",
          color: "#f5c879",
          fontSize: 20,
          letterSpacing: 6,
        }}
      >
        A LITTLE ROCKET. A LOT OF HUMANITY.
      </div>
      <div
        style={{
          display: "flex",
          fontFamily: "Silkscreen",
          fontSize: 112,
          marginTop: 32,
          marginBottom: 30,
          letterSpacing: -8,
        }}
      >
        OFFCOURSE
      </div>
      <div style={{ display: "flex", fontSize: 27, color: "#a9bdcf" }}>
        Guess what humanity thinks. Chart your course.
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 18,
          marginTop: 58,
          color: "#f5c879",
        }}
      >
        DAILY EXPEDITION · ENDLESS VOYAGE
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 14,
          marginTop: 22,
          color: "#a9bdcf",
        }}
      >
        An illustrative browser-game demo
      </div>
    </div>,
    { ...size, fonts: [{ name: "Silkscreen", data: font, weight: 400 }] }
  );
}
