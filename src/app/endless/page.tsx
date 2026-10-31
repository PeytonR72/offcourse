import type { Metadata } from "next";
import { Endless } from "./endless";
import { ModeIntro } from "../mode-intro";

export const metadata: Metadata = {
  title: "Endless Voyage",
  description:
    "Trust your intuition and keep your rocket flying. Predict within 10 percentage points to grow your streak in Offcourse. Illustrative demo results.",
  alternates: { canonical: "/endless" },
};
export default function EndlessPage() {
  return (
    <main id="main-content" tabIndex={-1} className="game-page">
      <ModeIntro mode="endless" />
      <div className="game-session">
        <Endless />
      </div>
    </main>
  );
}
