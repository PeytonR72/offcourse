import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { ServerPlay } from "./server-play";
import type { PlayManifest } from "../../domain/server-play";

const play: PlayManifest = {
  id: "9c158c52-d7aa-4c80-88ee-f85fe1994b74",
  mode: "daily",
  dateKey: "2026-10-30",
  status: "active",
  totalDistance: 0,
  streak: 0,
  results: [],
  questions: [
    {
      question: {
        id: "tea",
        prompt: "Tea today?",
        yesLabel: "Tea",
        noLabel: "Coffee",
        category: "test",
        sourceType: "licensed_external",
        status: "published",
        distributionId: "tea:v1",
      },
      distributionVersion: 1,
    },
  ],
};
afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

test("a disconnected lock freezes the prediction and retries the same payload after reload", async () => {
  localStorage.clear();
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ status: "ok", play }))
    .mockRejectedValue(new Error("Offline"));
  vi.stubGlobal("fetch", fetcher);
  const view = render(<ServerPlay mode="daily" />);
  await screen.findByText("Tea today?");
  fireEvent.click(screen.getByRole("radio", { name: "NO" }));
  fireEvent.change(screen.getByRole("slider"), { target: { value: "57" } });
  fireEvent.click(screen.getByRole("button", { name: "Lock prediction" }));
  await screen.findByRole("button", { name: "Retry connection" });
  expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  expect(screen.queryByText(/Actual YES/)).not.toBeInTheDocument();
  const body = fetcher.mock.calls[1][1]?.body;
  expect(JSON.parse(String(body))).toMatchObject({
    answer: "no",
    guessPercentage: 57,
    roundIndex: 0,
  });
  view.unmount();
  render(<ServerPlay mode="daily" />);
  await screen.findByRole("button", { name: "Retry connection" });
  expect(fetcher.mock.calls.at(-1)?.[1]?.body).toBe(body);
});

test("unlocked inputs survive reload without requesting an answer", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn<typeof fetch>()
      .mockImplementation(async () => Response.json({ status: "ok", play }))
  );
  const view = render(<ServerPlay mode="daily" />);
  await screen.findByText("Tea today?");
  fireEvent.click(screen.getByRole("radio", { name: "YES" }));
  fireEvent.change(screen.getByRole("slider"), { target: { value: "73" } });
  view.unmount();
  render(<ServerPlay mode="daily" />);
  await waitFor(() => expect(screen.getByRole("slider")).toHaveValue("73"));
  expect(screen.getByRole("radio", { name: "YES" })).toBeChecked();
});

test("a different tab's locked prediction can be recovered without an editable replay", async () => {
  const result = {
    lock: {
      roundId: `${play.id}:0`,
      question: play.questions[0].question,
      distributionVersion: 1,
      answer: "yes" as const,
      guessPercentage: 67,
    },
    distribution: {
      id: "tea:v1",
      questionId: "tea",
      version: 1,
      yesPercentage: 67,
      sampleSize: 100,
      frozenAt: "2026-10-30T00:00:00Z",
      eligibilityStatus: "eligible" as const,
      sourceAttribution: "Synthetic fixture",
    },
    score: { error: 0, survived: true, distance: 100 },
  };
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ status: "ok", play }))
    .mockResolvedValueOnce(
      Response.json(
        {
          status: "conflict",
          play: {
            ...play,
            results: [result],
            status: "complete",
            totalDistance: 100,
            streak: 1,
          },
        },
        { status: 409 }
      )
    );
  vi.stubGlobal("fetch", fetcher);
  render(<ServerPlay mode="daily" />);
  await screen.findByText("Tea today?");
  fireEvent.click(screen.getByRole("radio", { name: "NO" }));
  fireEvent.click(screen.getByRole("button", { name: "Lock prediction" }));
  await screen.findByText("Actual YES: 67%");
  expect(screen.getByText("Your prediction: 67% YES")).toBeInTheDocument();
  expect(screen.queryByRole("slider")).not.toBeInTheDocument();
});

test("a pending lock is never sent when browser storage cannot save it", async () => {
  const fetcher = vi
    .fn<typeof fetch>()
    .mockImplementation(async () => Response.json({ status: "ok", play }));
  vi.stubGlobal("fetch", fetcher);
  render(<ServerPlay mode="daily" />);
  await screen.findByText("Tea today?");
  fireEvent.click(screen.getByRole("radio", { name: "YES" }));
  const denied = vi
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation(() => {
      throw new Error("Storage full");
    });
  try {
    fireEvent.click(screen.getByRole("button", { name: "Lock prediction" }));
    await screen.findByRole("button", { name: "Retry connection" });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/Actual YES:/)).not.toBeInTheDocument();
  } finally {
    denied.mockRestore();
  }
});
