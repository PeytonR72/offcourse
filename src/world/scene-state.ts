import type { RoundState } from "../domain/run";

/** Presentation only. It can never dispatch events or award distance. */
export type SceneState = Readonly<{
  phase: RoundState["phase"];
  predictionOffset: number;
  targetOffset: number | null;
  outcome: "perfect" | "survive" | "miss" | null;
}>;

const offset = (percentage: number) => (percentage - 50) / 50;

export function toSceneState(round: RoundState): SceneState {
  switch (round.phase) {
    case "idle":
    case "answering":
      return {
        phase: round.phase,
        predictionOffset: 0,
        targetOffset: null,
        outcome: null,
      };
    case "aiming":
      return {
        phase: round.phase,
        predictionOffset: offset(round.guessPercentage ?? 50),
        targetOffset: null,
        outcome: null,
      };
    case "locked":
    case "flight":
      return {
        phase: round.phase,
        predictionOffset: offset(round.lock.guessPercentage),
        targetOffset: null,
        outcome: null,
      };
    case "reveal":
    case "resolved": {
      const { lock, distribution, score } = round.result;
      return {
        phase: round.phase,
        predictionOffset: offset(lock.guessPercentage),
        targetOffset: offset(distribution.yesPercentage),
        outcome:
          score.error === 0 ? "perfect" : score.survived ? "survive" : "miss",
      };
    }
  }
}
