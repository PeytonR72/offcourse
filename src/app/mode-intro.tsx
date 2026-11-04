import { preload } from "react-dom";
import { FlightIcon } from "./flight-icon";
import { MissionTitle } from "./mission-title";

export function ModeIntro({ mode }: { mode: "daily" | "endless" }) {
  preload("/art/observatory-flight.webp", { as: "image" });
  const daily = mode === "daily";
  return (
    <>
      <div className="mode-heading">
        <FlightIcon kind={daily ? "sun" : "infinity"} />
        <MissionTitle mode={mode}>
          <h1>{daily ? "Daily Expedition" : "Endless Voyage"}</h1>
        </MissionTitle>
      </div>
      <p className="game-intro">
        {daily
          ? "Five questions. Up to 500 light-years. Every round counts, even when you miss."
          : "Stay within 10 percentage points, including exactly 10, to keep flying. One miss ends your voyage."}
      </p>
      <p className="demo-disclosure">
        <FlightIcon kind="info" />
        <span>
          <strong>Illustrative results</strong> · Simulated, not real votes.
        </span>
      </p>
    </>
  );
}
