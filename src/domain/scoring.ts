export type RunMode = "daily" | "endless";

export type RoundScore = Readonly<{
  error: number;
  survived: boolean;
  distance: number;
}>;

export function scoreRound(
  mode: RunMode,
  guessPercentage: number,
  actualPercentage: number
): RoundScore {
  if (
    !Number.isInteger(guessPercentage) ||
    guessPercentage < 0 ||
    guessPercentage > 100
  ) {
    throw new Error("Guess must be an integer between 0 and 100");
  }
  if (
    !Number.isFinite(actualPercentage) ||
    actualPercentage < 0 ||
    actualPercentage > 100
  ) {
    throw new Error("Crowd percentage must be between 0 and 100");
  }
  const error = Math.abs(guessPercentage - actualPercentage);
  const survived = error <= 10;
  return Object.freeze({
    error,
    survived,
    distance:
      mode === "endless" && !survived
        ? 0
        : Math.round(Math.max(0, 100 - 5 * error)),
  });
}
