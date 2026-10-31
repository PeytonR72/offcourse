import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { Daily } from "./daily";
import { ProgressStorageProvider } from "../progress-storage";

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

test("daily remains playable with a session-only notice when storage writes are blocked", async () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("Denied");
  });
  render(<Daily />);
  expect(
    await screen.findByText(/Progress and records last only/)
  ).toBeVisible();
  fireEvent.click(screen.getByRole("radio", { name: "YES" }));
  expect(screen.getByRole("button", { name: "Lock prediction" })).toBeEnabled();
});

test("session-only daily input survives leaving and returning to the game", async () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("Denied");
  });
  const view = render(
    <ProgressStorageProvider>
      <Daily />
    </ProgressStorageProvider>
  );
  fireEvent.click(await screen.findByRole("radio", { name: "NO" }));
  fireEvent.change(screen.getByRole("slider"), { target: { value: "73" } });
  view.rerender(
    <ProgressStorageProvider>
      <p>Another mode</p>
    </ProgressStorageProvider>
  );
  view.rerender(
    <ProgressStorageProvider>
      <Daily />
    </ProgressStorageProvider>
  );
  await waitFor(() => expect(screen.getByRole("slider")).toHaveValue("73"));
  expect(screen.getByRole("radio", { name: "NO" })).toBeChecked();
});

test("daily play shows progress, finishes all five misses and blocks replay after reload", async () => {
  vi.stubGlobal("matchMedia", () => ({
    matches: true,
    addEventListener() {},
    removeEventListener() {},
  }));
  const view = render(<Daily />);
  for (let index = 1; index <= 5; index++) {
    expect(await screen.findByText(`Round ${index} of 5`)).toBeVisible();
    fireEvent.click(screen.getByRole("radio", { name: "NO" }));
    fireEvent.change(screen.getByRole("slider"), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: "Lock prediction" }));
    if (index < 5) {
      // Verify completion rather than a one-second scheduler deadline under suite load.
      await screen.findByRole(
        "heading",
        { name: "Round result" },
        { timeout: 3000 }
      );
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    }
  }
  await waitFor(() =>
    expect(
      screen.getByRole("heading", { name: "Daily complete" })
    ).toHaveFocus()
  );
  expect(screen.getByText(/5 of 5 destinations explored/)).toBeVisible();
  expect(screen.getByText(/Already played/)).toBeVisible();
  expect(
    screen.getByRole("textbox", { name: "Daily share text" })
  ).toHaveTextContent("Demo · Illustrative results");
  expect(
    screen.getByRole("link", { name: "Play Endless Voyage" })
  ).toHaveAttribute("href", "/endless");
  expect(
    screen.queryByRole("button", { name: /Lock|Restart|Replay/i })
  ).not.toBeInTheDocument();
  view.unmount();
  render(<Daily />);
  expect(
    await screen.findByRole("heading", { name: "Daily complete" })
  ).toBeVisible();
  expect(screen.queryByRole("slider")).not.toBeInTheDocument();
});
