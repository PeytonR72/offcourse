import { expect, test } from "@playwright/test";

for (const route of ["/daily", "/endless"]) {
  test(`${route} can play with blocked storage and preferences remain usable`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new Error("Denied");
        },
      });
    });
    await page.goto(route);
    await expect(
      page.getByText(/Progress and records last only/)
    ).toBeVisible();
    await page
      .getByRole("button", { name: /^Sound (on|off)$/, exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: /^Sound (on|off)$/, exact: true })
    ).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("radio", { name: "NO", exact: true }).check();
    await page.getByRole("slider").fill("73");
    await page
      .getByRole("link", { name: "Offcourse · Practice", exact: true })
      .click();
    await page
      .getByRole("link", {
        name:
          route === "/daily"
            ? /Launch Daily Expedition/
            : /Launch Endless Voyage/,
      })
      .click();
    await expect(page.getByRole("slider")).toHaveValue("73");
    await expect(
      page.getByRole("radio", { name: "NO", exact: true })
    ).toBeChecked();
    await page.getByRole("slider").fill("0");
    await page.getByRole("button", { name: "Lock prediction" }).click();
    await expect(page.getByText(/Actual YES:/)).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath("session-fallback.png"),
      fullPage: true,
    });
    if (route === "/endless") {
      await page.getByRole("button", { name: "Restart voyage" }).click();
      await expect(
        page.getByText("Current streak: 0", { exact: true })
      ).toBeVisible();
    }
  });
}
