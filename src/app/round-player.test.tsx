import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { Practice } from "./practice";

test("pauses an unlocked prediction and resumes with the same answer and aim", () => {
  render(<Practice />);
  fireEvent.click(screen.getByRole("radio", { name: "NO" }));
  fireEvent.change(screen.getByRole("slider"), { target: { value: "73" } });
  fireEvent.click(screen.getByRole("button", { name: "Pause" }));
  expect(screen.getByRole("button", { name: "Resume" })).toHaveFocus();
  expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  expect(screen.queryByText(/Actual YES:/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Resume" }));
  expect(screen.getByRole("radio", { name: "NO" })).toBeChecked();
  expect(screen.getByRole("slider")).toHaveValue("73");
  expect(screen.getByRole("heading", { level: 2 })).toHaveFocus();
});
