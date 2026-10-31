import { expect, test } from "@playwright/test";

declare global {
  interface Window {
    feedbackEvents: string[];
  }
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.feedbackEvents = [];
    const NativeAudio = window.AudioContext;
    window.AudioContext = class extends NativeAudio {
      constructor() {
        super();
        window.feedbackEvents.push("audio-created");
      }
      createOscillator() {
        const oscillator = super.createOscillator();
        const start = oscillator.start.bind(oscillator);
        oscillator.start = (when) => {
          window.feedbackEvents.push("note");
          start(when);
        };
        return oscillator;
      }
    };
    Object.defineProperty(navigator, "vibrate", {
      configurable: true,
      value: () => {
        window.feedbackEvents.push("haptic");
        return true;
      },
    });
  });
});

test("feedback is opt-in, mute persists, and reload never autoplays", async ({
  page,
}) => {
  await page.goto("/");
  const events = () => page.evaluate(() => window.feedbackEvents);
  await expect(
    page.getByRole("button", { name: /^Sound (on|off)$/, exact: true })
  ).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("radio", { name: "YES", exact: true }).check();
  await page.getByRole("button", { name: "Lock prediction" }).click();
  await expect(
    page.getByRole("heading", { name: "Round result" })
  ).toBeVisible();
  expect(await events()).toEqual([]);
  await page
    .getByRole("button", { name: /^Sound (on|off)$/, exact: true })
    .click();
  await page
    .getByRole("button", { name: /^Haptics (on|off)$/, exact: true })
    .click();
  expect(await events()).toEqual([]);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("radio", { name: "YES", exact: true }).check();
  await page.getByRole("button", { name: "Lock prediction" }).click();
  await expect.poll(events).toContain("note");
  expect(await events()).toContain("haptic");
  await page.reload();
  await expect(
    page.getByRole("button", { name: /^Sound (on|off)$/, exact: true })
  ).toHaveAttribute("aria-pressed", "true");
  expect(await events()).toEqual([]);
  await page
    .getByRole("button", { name: /^Sound (on|off)$/, exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: /^Sound (on|off)$/, exact: true })
  ).toHaveAttribute("aria-pressed", "false");
  expect(await events()).toEqual([]);
});

test("reduced motion stops idle movement, skips polish immediately, and suppresses haptics", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  const scene = page.getByTestId("rocket-world");
  await expect(scene).toHaveAttribute("data-renderer", "ready");
  await page
    .getByRole("button", { name: /^Haptics (on|off)$/, exact: true })
    .click();
  await page
    .getByRole("button", { name: /^Reduce motion (on|off)$/, exact: true })
    .click();
  await expect(scene).toHaveAttribute("data-reduced-motion", "true");
  await page.clock.install();
  const rocket = scene.locator("svg > g[transform]");
  const transform = await rocket.getAttribute("transform");
  await page.clock.runFor(900);
  expect(await rocket.getAttribute("transform")).toBe(transform);
  await page.getByRole("radio", { name: "NO", exact: true }).check();
  await page.getByRole("slider").fill("44");
  await page.getByRole("button", { name: "Lock prediction" }).click();
  await page.clock.runFor(32);
  await expect(page.getByRole("status")).toContainText("Distance: 100 ly");
  await expect(scene).toHaveAttribute("data-stage", "settled");
  await expect(
    scene.getByTestId("engine-sparks").locator("circle")
  ).toHaveCount(0);
  expect(await page.evaluate(() => window.feedbackEvents)).toEqual([]);
  await page.screenshot({
    path: testInfo.outputPath("reduced-polish.png"),
    fullPage: true,
  });
  await page.reload();
  await expect(
    page.getByRole("button", { name: /^Reduce motion (on|off)$/, exact: true })
  ).toHaveAttribute("aria-pressed", "true");
  await page.emulateMedia({ reducedMotion: "reduce" });
  // The device preference wins even if the manual preference is turned off.
  await page
    .getByRole("button", { name: /^Reduce motion (on|off)$/, exact: true })
    .click();
  await expect(scene).toHaveAttribute("data-reduced-motion", "true");
});

test("restoring a locked voyage is silent despite persisted sound opt-in", async ({
  page,
}) => {
  await page.goto("/endless");
  await page
    .getByRole("button", { name: /^Sound (on|off)$/, exact: true })
    .click();
  await page.getByRole("radio", { name: "YES", exact: true }).check();
  await page.getByRole("button", { name: "Lock prediction" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: /^Sound (on|off)$/, exact: true })
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("rocket-world")).toHaveAttribute(
    "data-stage",
    "settled"
  );
  expect(await page.evaluate(() => window.feedbackEvents)).toEqual([]);
});

test("muting during a flight cancels its result cue without delaying scoring", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: /^Sound (on|off)$/, exact: true })
    .click();
  await page.getByRole("radio", { name: "YES", exact: true }).check();
  await page.getByRole("slider").fill("44");
  await page.clock.install();
  await page.getByRole("button", { name: "Lock prediction" }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () => window.feedbackEvents.filter((event) => event === "note").length
      )
    )
    .toBe(2);
  await page
    .getByRole("button", { name: /^Sound (on|off)$/, exact: true })
    .click();
  await page.clock.runFor(1850);
  await expect(page.getByRole("status")).toContainText("Distance: 100 ly");
  expect(
    await page.evaluate(
      () => window.feedbackEvents.filter((event) => event === "note").length
    )
  ).toBe(2);
});

test("blocked storage and unavailable feedback APIs leave practice playable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("Storage unavailable");
      },
    });
    Object.defineProperty(window, "AudioContext", { value: undefined });
    Object.defineProperty(navigator, "vibrate", { value: undefined });
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: /^Haptics (on|off)$/, exact: true })
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: /^Sound (on|off)$/, exact: true })
    .click();
  await page.getByRole("radio", { name: "YES", exact: true }).check();
  await page.getByRole("button", { name: "Lock prediction" }).click();
  await expect(
    page.getByRole("heading", { name: "Round result" })
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("abandoning a flight cannot authorize sound for a restored round on another route", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/daily");
  await page.getByRole("radio", { name: "YES", exact: true }).check();
  await page.getByRole("button", { name: "Lock prediction" }).click();
  await expect(
    page.getByRole("heading", { name: "Round result" })
  ).toBeVisible();
  await page.getByRole("link", { name: "Offcourse · Practice" }).click();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page
    .getByRole("button", { name: /^Sound (on|off)$/, exact: true })
    .click();
  await page.clock.install();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.getByRole("radio", { name: "YES", exact: true }).check();
  await page.getByRole("button", { name: "Lock prediction" }).click();
  expect(
    await page.evaluate(
      () => window.feedbackEvents.filter((event) => event === "note").length
    )
  ).toBe(2);
  await page
    .getByRole("link", { name: "Play Daily Expedition · 5 rounds" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Round result" })
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => window.feedbackEvents.filter((event) => event === "note").length
    )
  ).toBe(2);
});
