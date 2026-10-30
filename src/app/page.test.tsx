import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import Home from "./page";

test("introduces the prototype with an honest results disclosure", () => {
  render(<Home />);

  expect(screen.getByRole("heading", { name: "Offcourse" })).toBeVisible();
  expect(
    screen.getByText("Prototype in progress", { exact: true })
  ).toBeVisible();
  expect(
    screen.getByText("Illustrative results", { exact: true })
  ).toBeVisible();
  expect(screen.getByText(/simulated, not real crowd votes/i)).toBeVisible();
});
