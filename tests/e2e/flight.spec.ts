import { expect, test } from "@playwright/test";

for (const { guess, outcome, distance } of [
  { guess: 44, outcome: "perfect", distance: 100 },
  { guess: 54, outcome: "survive", distance: 50 },
  { guess: 55, outcome: "miss", distance: 45 },
]) {
  test(`${outcome} flight reveals after approach and settles once`, async ({
    page,
  }, testInfo) => {
    await page.clock.install({ time: new Date("2026-10-29T12:00:00Z") });
    await page.clock.pauseAt(new Date("2026-10-29T12:00:01Z"));
    await page.goto("/");
    const scene = page.getByTestId("rocket-world");
    await expect(scene).toHaveAttribute("data-renderer", "ready");
    await page.getByRole("radio", { name: "YES", exact: true }).check();
    await page.getByRole("slider").fill(String(guess));
    await page.getByRole("button", { name: "Lock prediction" }).click();
    await expect(scene).toHaveAttribute("data-stage", "anticipation");
    await expect(
      page.getByRole("button", { name: "Skip flight" })
    ).toBeDisabled();
    await page.clock.runFor(200);
    await expect(scene).toHaveAttribute("data-stage", "ignition");
    await page.clock.runFor(500);
    await expect(scene).toHaveAttribute("data-stage", "flight");
    await scene.screenshot({
      path: testInfo.outputPath(`${outcome}-flight.png`),
    });
    await page.clock.runFor(400);
    await expect(scene).toHaveAttribute("data-stage", "approach");
    await expect(scene).toHaveAttribute("data-outcome", "hidden");
    await expect(page.getByText(/Actual YES:/)).toHaveCount(0);
    await page.clock.runFor(200);
    await expect(scene).toHaveAttribute("data-phase", "reveal");
    await expect(scene).toHaveAttribute("data-outcome", outcome);
    await expect(page.getByRole("status")).toContainText("Actual YES: 44%");
    await scene.screenshot({
      path: testInfo.outputPath(`${outcome}-reveal.png`),
    });
    await page.getByRole("button", { name: "Skip flight" }).click();
    await expect(scene).toHaveAttribute("data-stage", "settled");
    await expect(page.getByRole("status")).toContainText(
      `Distance: ${distance} ly`
    );
    await page.clock.runFor(5000);
    await expect(page.getByRole("status")).toContainText(
      `Distance: ${distance} ly`
    );
    await page.getByRole("button", { name: "Continue" }).click();
    await page.clock.runFor(3000);
    await expect(scene).toHaveAttribute("data-phase", "answering");
    await expect(scene.locator("canvas")).toHaveCount(1);
  });
}

test("reduced motion uses a static final state and remains playable", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("radio", { name: "NO", exact: true }).check();
  await page.getByRole("slider").fill("44");
  await page.getByRole("button", { name: "Lock prediction" }).click();
  await expect(page.getByTestId("rocket-world")).toHaveAttribute(
    "data-stage",
    "settled"
  );
  await expect(page.getByRole("status")).toContainText("Distance: 100 ly");
  await page.screenshot({
    path: testInfo.outputPath("reduced-motion.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(
    page.getByRole("button", { name: "Lock prediction" })
  ).toBeDisabled();
});

test("turning reduced motion on during flight finishes without stale callbacks", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("radio", { name: "YES", exact: true }).check();
  await page.getByRole("button", { name: "Lock prediction" }).click();
  await expect(
    page.getByRole("button", { name: "Skip flight" })
  ).toBeDisabled();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.getByTestId("rocket-world")).toHaveAttribute(
    "data-stage",
    "settled"
  );
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(
    page.getByRole("button", { name: "Lock prediction" })
  ).toBeDisabled();
});
