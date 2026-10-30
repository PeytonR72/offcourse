import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { ExperienceProvider } from "./experience";
import Home from "./page";

test("all local preferences survive remount and remain usable when storage is unavailable", async () => {
  localStorage.clear();
  vi.stubGlobal("navigator", { vibrate: vi.fn() });
  const view = render(
    <ExperienceProvider>
      <p>Demo</p>
    </ExperienceProvider>
  );
  for (const name of ["Sound", "Reduce motion", "Haptics"]) {
    const button = await screen.findByRole("button", { name });
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);
  }
  view.unmount();
  const restored = render(
    <ExperienceProvider>
      <p>Demo</p>
    </ExperienceProvider>
  );
  for (const name of ["Sound", "Reduce motion", "Haptics"])
    await waitFor(() =>
      expect(screen.getByRole("button", { name })).toHaveAttribute(
        "aria-pressed",
        "true"
      )
    );
  restored.unmount();
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("Denied");
  });
  try {
    render(
      <ExperienceProvider>
        <p>Demo</p>
      </ExperienceProvider>
    );
    const sound = screen.getByRole("button", { name: "Sound" });
    await waitFor(() => expect(sound).toBeEnabled());
    fireEvent.click(sound);
    expect(sound).toHaveAttribute("aria-pressed", "false");
  } finally {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
  }
});

test("sound defaults off and the player's mute choice survives remounting", async () => {
  localStorage.clear();
  const first = render(
    <ExperienceProvider>
      <Home />
    </ExperienceProvider>
  );
  const sound = await screen.findByRole("button", { name: "Sound" });
  expect(sound).toHaveAttribute("aria-pressed", "false");
  fireEvent.click(sound);
  expect(sound).toHaveAttribute("aria-pressed", "true");
  first.unmount();
  const second = render(
    <ExperienceProvider>
      <Home />
    </ExperienceProvider>
  );
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Sound" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
  );
  fireEvent.click(screen.getByRole("button", { name: "Sound" }));
  second.unmount();
  render(
    <ExperienceProvider>
      <Home />
    </ExperienceProvider>
  );
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Sound" })).toHaveAttribute(
      "aria-pressed",
      "false"
    )
  );
});
