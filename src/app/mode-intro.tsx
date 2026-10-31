import Link from "next/link";
import { FlightIcon } from "./flight-icon";

export function ModeIntro({ mode }: { mode: "daily" | "endless" }) {
  const daily = mode === "daily";
  return (
    <>
      <Link href="/#practice" className="back-link">
        <span aria-hidden="true">←</span> Offcourse · Practice
      </Link>
      <div className="mode-heading">
        <FlightIcon kind={daily ? "sun" : "infinity"} />
        <h1>{daily ? "Daily Expedition" : "Endless Voyage"}</h1>
      </div>
      <p className="game-intro">
        {daily
          ? "Five questions. Up to 500 light-years. Every round counts, even when you miss."
          : "Stay within 10 percentage points, including exactly 10, to keep flying. One miss ends your voyage."}
      </p>
      <div className="demo-disclosure">
        <span className="status-dot" />
        <p>
          <strong>Illustrative results</strong>Percentages are simulated, not
          real crowd votes.
        </p>
      </div>
    </>
  );
}
