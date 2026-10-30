import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { ShareSummary } from "./share-summary";

afterEach(() => vi.unstubAllGlobals());

test("shares only the supplied anonymous summary through native share", async () => {
  const share = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal("navigator", { share });
  render(<ShareSummary text="Anonymous daily result" />);
  fireEvent.click(screen.getByRole("button", { name: "Share daily summary" }));
  expect(await screen.findByText("Summary shared.")).toBeVisible();
  expect(share).toHaveBeenCalledWith({ text: "Anonymous daily result" });
});

test("copies the summary when native share is unavailable", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal("navigator", { clipboard: { writeText } });
  render(<ShareSummary text="Anonymous daily result" />);
  fireEvent.click(screen.getByRole("button", { name: "Share daily summary" }));
  expect(await screen.findByText("Summary copied.")).toBeVisible();
  expect(writeText).toHaveBeenCalledWith("Anonymous daily result");
});

test("a rejected native share falls back to copy, with manual recovery if clipboard is denied", async () => {
  vi.stubGlobal("navigator", {
    share: vi.fn().mockRejectedValue(new Error("Share denied")),
    clipboard: {
      writeText: vi.fn().mockRejectedValue(new Error("Clipboard denied")),
    },
  });
  render(<ShareSummary text="Anonymous daily result" />);
  fireEvent.click(screen.getByRole("button", { name: "Share daily summary" }));
  expect(await screen.findByText(/Copy unavailable/)).toBeVisible();
  expect(
    screen.getByRole("textbox", { name: "Daily share text" })
  ).toHaveFocus();
  expect(screen.getByRole("textbox")).toHaveValue("Anonymous daily result");
});

test("canceling native share does not copy anything or prevent a later explicit copy", async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal("navigator", {
    share: vi
      .fn()
      .mockRejectedValue(new DOMException("Canceled", "AbortError")),
    clipboard: { writeText },
  });
  render(<ShareSummary text="Anonymous daily result" />);
  fireEvent.click(screen.getByRole("button", { name: "Share daily summary" }));
  expect(await screen.findByText(/Sharing canceled/)).toBeVisible();
  expect(writeText).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Copy summary" }));
  expect(await screen.findByText("Summary copied.")).toBeVisible();
});
