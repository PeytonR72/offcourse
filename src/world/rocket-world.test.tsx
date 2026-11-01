import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { demoCatalog } from "../data/demo-questions";
import { createRun, transitionRun, type RunEvent } from "../domain/run";
import { RocketWorld } from "./rocket-world";

test("revealed annotations preserve fractional results without claiming a perfect match", () => {
  const snapshot = demoCatalog.entries[0];
  const events: RunEvent[] = [
    {
      type: "start_round",
      roundId: "fractional",
      question: snapshot.question,
      distributionVersion: snapshot.distribution.version,
    },
    { type: "choose_answer", answer: "yes" },
    { type: "aim", percentage: 63 },
    { type: "lock" },
    { type: "launch" },
    {
      type: "reveal",
      distribution: { ...snapshot.distribution, yesPercentage: 62.5 },
    },
    { type: "resolve" },
  ];
  const run = events.reduce(
    transitionRun,
    createRun("fractional-labels", "daily")
  );
  render(<RocketWorld run={run} />);
  expect(screen.getByRole("img")).toHaveAccessibleName(/Actual YES: 62.5%/);
  expect(screen.getByText("Actual 62.5%")).toBeVisible();
  expect(screen.getByText("Predicted 63%")).toBeVisible();
  expect(screen.getByText("0.5 points above actual")).toBeVisible();
  expect(screen.queryByText(/Perfect/)).not.toBeInTheDocument();
});
