import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import ErrorPage from "./error";

test("unexpected errors offer retry and demo recovery without exposing error details", () => {
  const reset = vi.fn();
  render(
    <ErrorPage error={new Error("private connection details")} reset={reset} />
  );
  expect(
    screen.getByRole("heading", { name: "Flight interrupted" })
  ).toBeVisible();
  expect(screen.queryByText(/private connection/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(reset).toHaveBeenCalledOnce();
  expect(
    screen.getByRole("link", { name: "Open demo practice" })
  ).toHaveAttribute("href", "/");
});
