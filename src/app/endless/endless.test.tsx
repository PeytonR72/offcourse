import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { demoCatalog } from "../../data/demo-questions";
import { Endless } from "./endless";

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

test("survives 10, ends at 11, and restarts with browser bests intact", async () => {
  vi.stubGlobal("matchMedia", () => ({
    matches: true,
    addEventListener() {},
    removeEventListener() {},
  }));
  const view = render(<Endless />);
  async function predict(error: number) {
    const heading = await screen.findByRole("heading", { level: 2 });
    const entry = demoCatalog.entries.find(
      ({ question }) => question.prompt === heading.textContent
    )!;
    const actual = entry.distribution.yesPercentage;
    fireEvent.click(screen.getByRole("radio", { name: "NO" }));
    fireEvent.change(screen.getByRole("slider"), {
      target: { value: String(actual > 50 ? actual - error : actual + error) },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lock prediction" }));
  }
  await predict(10);
  await screen.findByRole("heading", { name: "Round result" });
  expect(screen.getByText("Current streak: 1")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  await predict(11);
  expect(
    await screen.findByRole("heading", { name: "Voyage ended" })
  ).toHaveFocus();
  expect(
    screen.queryByRole("button", { name: "Continue" })
  ).not.toBeInTheDocument();
  expect(screen.getByText("Run distance: 50 ly")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Restart voyage" }));
  expect(await screen.findByRole("slider")).toBeDisabled();
  expect(screen.getByText("Current streak: 0")).toBeVisible();
  expect(screen.getByText("Best streak: 1")).toBeVisible();
  expect(screen.getByText("Best distance: 50 ly")).toBeVisible();
  view.unmount();
  render(<Endless />);
  expect(await screen.findByText("Best streak: 1")).toBeVisible();
});
