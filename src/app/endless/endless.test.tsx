import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { demoCatalog } from "../../data/demo-questions";
import { Endless } from "./endless";

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  vi.unstubAllGlobals();
});

test("endless remains playable with session records when localStorage access throws", async () => {
  vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
    throw new Error("Denied");
  });
  render(<Endless />);
  expect(
    await screen.findByText(/Progress and records last only/)
  ).toBeVisible();
  expect(screen.getByText("Best streak: 0")).toBeVisible();
  fireEvent.click(screen.getByRole("radio", { name: "YES" }));
  expect(screen.getByRole("button", { name: "Lock prediction" })).toBeEnabled();
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
  await waitFor(
    () =>
      expect(
        screen.getByRole("heading", { name: "Voyage ended" })
      ).toHaveFocus(),
    { timeout: 3000 }
  );
  expect(
    screen.queryByRole("button", { name: "Continue" })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Play Daily Expedition" })
  ).toHaveAttribute("href", "/daily");
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
