import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import Home from "./page";
import { Practice } from "./practice";

test("offers both expeditions and instructions before the practice flight", () => {
  render(<Home />);
  expect(
    screen.getByRole("link", { name: /launch daily expedition/i })
  ).toHaveAttribute("href", "/daily");
  expect(
    screen.getByRole("link", { name: /launch endless voyage/i })
  ).toHaveAttribute("href", "/endless");
  expect(screen.getByRole("link", { name: /how to play/i })).toHaveAttribute(
    "href",
    "#how-to-play"
  );
});

test("introduces the prototype with an honest results disclosure", () => {
  render(<Home />);

  expect(screen.getByRole("heading", { name: "Offcourse" })).toBeVisible();
  expect(
    screen.getByText("Prototype in progress", { exact: true })
  ).toBeVisible();
  expect(
    screen.getByText("Illustrative results", { exact: true })
  ).toBeVisible();
  for (const disclosure of screen.getAllByText(
    /simulated, not real crowd votes/i
  ))
    expect(disclosure).toBeVisible();
});

test("locks once, reveals numeric feedback and continues with fresh input", async () => {
  render(<Practice />);
  const question = screen.getByRole("heading", { level: 2 }).textContent;
  fireEvent.click(screen.getByRole("radio", { name: "YES" }));
  fireEvent.change(screen.getByRole("slider"), { target: { value: "100" } });
  const lock = screen.getByRole("button", { name: "Lock prediction" });
  fireEvent.click(lock);
  expect(
    await screen.findByRole(
      "heading",
      { name: "Round result" },
      { timeout: 3000 }
    )
  ).toBeVisible();
  expect(screen.getByText(/Your prediction: 100% YES/)).toBeVisible();
  expect(screen.getByText(/Actual YES: \d+%/)).toBeVisible();
  expect(screen.getByText(/Error: \d+ percentage points/)).toBeVisible();
  expect(screen.getByRole("status")).toHaveTextContent(/Distance: \d+ ly/);
  fireEvent.click(lock);
  expect(screen.getAllByRole("heading", { name: "Round result" })).toHaveLength(
    1
  );
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  expect(screen.getByRole("heading", { level: 2 }).textContent).not.toBe(
    question
  );
  expect(
    screen.getByRole("button", { name: "Lock prediction" })
  ).toBeDisabled();
  expect(screen.queryByText(/Actual YES/)).not.toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "YES" })).not.toBeChecked();
});

test("locks input during flight, permits skip only after reveal and leaves a stable result", async () => {
  render(<Practice />);
  fireEvent.click(screen.getByRole("radio", { name: "YES" }));
  fireEvent.click(screen.getByRole("button", { name: "Lock prediction" }));
  expect(screen.queryByText(/Actual YES:/)).not.toBeInTheDocument();
  expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  const skip = screen.getByRole("button", { name: "Skip flight" });
  expect(skip).toBeDisabled();
  await waitFor(() => expect(skip).toBeEnabled(), { timeout: 2500 });
  fireEvent.click(skip);
  expect(screen.getByRole("heading", { name: "Round result" })).toHaveFocus();
  expect(screen.getByText("Your prediction: 50% YES")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  expect(screen.queryByText(/Actual YES:/)).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Lock prediction" })
  ).toBeDisabled();
});

test("reduced motion shows the static result without a moving flight", async () => {
  vi.stubGlobal("matchMedia", () => ({
    matches: true,
    addEventListener() {},
    removeEventListener() {},
  }));
  try {
    render(<Practice />);
    fireEvent.click(screen.getByRole("radio", { name: "NO" }));
    fireEvent.click(screen.getByRole("button", { name: "Lock prediction" }));
    expect(
      await screen.findByRole("heading", { name: "Round result" })
    ).toBeVisible();
    expect(screen.getByTestId("rocket-world")).toHaveAttribute(
      "data-stage",
      "settled"
    );
  } finally {
    vi.unstubAllGlobals();
  }
});

test("chooses a personal answer and aims on the YES axis without revealing results", () => {
  render(<Practice />);
  const lock = screen.getByRole("button", { name: "Lock prediction" });
  expect(lock).toBeDisabled();
  expect(
    screen.queryByRole("heading", { name: "Round result" })
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("radio", { name: "NO" }));
  const slider = screen.getByRole("slider", {
    name: "Predict the YES vote",
  });
  fireEvent.change(slider, { target: { value: "0" } });
  expect(slider).toHaveValue("0");
  expect(screen.getByText("0% YES", { selector: "output" })).toBeVisible();
  fireEvent.change(slider, { target: { value: "100" } });
  expect(screen.getByText("100% YES", { selector: "output" })).toBeVisible();
  expect(lock).toBeEnabled();
  expect(screen.queryByText(/Actual YES/)).not.toBeInTheDocument();
});
