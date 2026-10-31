import type { Metadata } from "next";
import { Daily } from "./daily";
import { ModeIntro } from "../mode-intro";

export const metadata: Metadata = {
  title: "Daily Expedition",
  description:
    "Five questions, five destinations. Predict the crowd and travel up to 500 light-years in today's shared Offcourse expedition. Illustrative demo results.",
  alternates: { canonical: "/daily" },
};
export default function DailyPage() {
  return (
    <main id="main-content" tabIndex={-1} className="game-page">
      <ModeIntro mode="daily" />
      <div className="game-session">
        <Daily />
      </div>
    </main>
  );
}
