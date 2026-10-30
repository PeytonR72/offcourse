import type { DailyExpedition } from "./daily";

/** Accuracy is 100 minus mean absolute percentage-point error, to one decimal. */
export function dailySummary(daily: DailyExpedition) {
  if (daily.run.completedRounds.length !== 5)
    throw new Error("Complete the daily expedition before sharing.");
  const averageError =
    daily.run.completedRounds.reduce(
      (sum, round) => sum + round.score.error,
      0
    ) / 5;
  const accuracy = Math.round((100 - averageError) * 10) / 10;
  return {
    accuracy,
    averageError,
    text: `Offcourse · Daily Expedition · ${daily.dateKey} UTC\n${daily.run.totalDistance} / 500 ly · ${accuracy}% accuracy\nAverage error: ${averageError} percentage points (accuracy = 100 − average error).\nDemo · Illustrative results`,
  };
}
