import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { Daily } from "./daily";

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
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
      await screen.findByRole("heading", { name: "Round result" });
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
    screen.queryByRole("button", { name: /Lock|Restart|Replay/i })
  ).not.toBeInTheDocument();
  view.unmount();
  render(<Daily />);
  expect(
    await screen.findByRole("heading", { name: "Daily complete" })
  ).toBeVisible();
  expect(screen.queryByRole("slider")).not.toBeInTheDocument();
});
