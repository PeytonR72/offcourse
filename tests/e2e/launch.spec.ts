import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("health reports a demo without issuing player records or leaking targets", async ({
  request,
}) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toBe("no-store");
  expect(response.headers()["set-cookie"]).toBeUndefined();
  expect(await response.json()).toEqual({ status: "ok", play: "demo" });
});

test("privacy stays reachable and key screens pass the automated accessibility audit", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const audit = async (state: string) => {
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    await testInfo.attach(`${state}-accessibility.json`, {
      body: JSON.stringify(result),
      contentType: "application/json",
    });
    expect(result.violations, state).toEqual([]);
  };
  for (const route of ["/", "/daily", "/endless"]) {
    await page.goto(route);
    await page.getByRole("radio", { name: "NO", exact: true }).check();
    await audit(`${route.slice(1) || "practice"}-aim`);
    const privacy = page
      .getByRole("contentinfo")
      .getByRole("link", { name: "Privacy & storage" });
    await expect(privacy).toHaveAttribute("href", "/privacy");
    await page.getByRole("button", { name: "Pause", exact: true }).click();
    await audit(`${route.slice(1) || "practice"}-paused`);
    await page.getByRole("button", { name: "Resume", exact: true }).click();
    await page.getByRole("button", { name: "Lock prediction" }).click();
    await expect(page.getByText(/Actual YES:/)).toBeVisible();
    await audit(`${route.slice(1) || "practice"}-result`);
  }
  await page
    .getByRole("contentinfo")
    .getByRole("link", { name: "Privacy & storage" })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Privacy & storage"
  );
  await audit("privacy");
  await page.screenshot({
    path: testInfo.outputPath("privacy.png"),
    fullPage: true,
  });
  await page.goto("/play");
  await expect(
    page.getByText(/Server-backed play is unavailable/)
  ).toBeVisible();
  await audit("server-unavailable");
});
