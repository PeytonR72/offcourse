import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import PrivacyPage from "./page";

test("explains browser storage, optional server records, and how to reset local data", () => {
  render(<PrivacyPage />);
  expect(
    screen.getByRole("heading", { name: "Privacy & storage" })
  ).toBeVisible();
  expect(
    screen.getByText(/Clearing this site’s browser data resets/)
  ).toBeVisible();
  expect(screen.getByText(/does not delete any server records/)).toBeVisible();
  expect(screen.getByText(/not added to poll votes/)).toBeVisible();
  expect(screen.getByText(/No advertising trackers/)).toBeVisible();
  expect(
    screen.getByRole("link", { name: "Back to demo practice" })
  ).toHaveAttribute("href", "/");
});
