import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test } from "vitest";
import { ExperienceProvider } from "./experience";
import Home from "./page";

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
