import type { Run } from "../domain/run";
import { RocketWorld } from "../world/rocket-world";
import { FlightIcon } from "./flight-icon";

/** Presentation of the existing locked/aimed value; never hints at correctness. */
export function FlightDeck({
  run,
  elapsed,
  paused = false,
}: {
  run: Run;
  elapsed?: number;
  paused?: boolean;
}) {
  const round = run.round;
  const guess =
    round.phase === "aiming"
      ? round.guessPercentage
      : round.phase === "locked" || round.phase === "flight"
        ? round.lock.guessPercentage
        : round.phase === "reveal" || round.phase === "resolved"
          ? round.result.lock.guessPercentage
          : null;
  const revealed = round.phase === "reveal" || round.phase === "resolved";
  return (
    <div className="flight-deck">
      <div className="deck-heading">
        <span>
          <FlightIcon kind="orbit" /> FLIGHT COMPUTER
        </span>
        <span className="deck-signal">
          <i />
          <i />
          <i /> Online
        </span>
      </div>
      <RocketWorld run={run} elapsed={elapsed} paused={paused} />
      <div className="deck-readout" aria-hidden="true">
        <div>
          <span>Your heading</span>
          <strong>
            {guess ?? 50}
            <small>% YES</small>
          </strong>
        </div>
        <div>
          <span>{revealed ? "Flight log" : "Destination"}</span>
          <strong className="destination-status">
            {paused ? "On hold" : revealed ? "Revealed" : "Unknown"}
          </strong>
        </div>
      </div>
      <p className="deck-hint">
        {revealed
          ? "Every flight starts with a little intuition."
          : "The real destination appears after launch."}
      </p>
    </div>
  );
}
