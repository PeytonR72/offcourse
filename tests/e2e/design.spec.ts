import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("a narrow phone keeps aim, world, and launch together", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/daily");
  await page.getByRole("radio", { name: "YES", exact: true }).check();
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.getByTestId("rocket-world")).toBeInViewport({ ratio: 1 });
  await expect(
    page.getByRole("button", { name: "Lock prediction" })
  ).toBeInViewport({ ratio: 1 });
});

test("turning reduced motion on stops the title-screen rocket", async ({
  page,
}) => {
  await page.goto("/");
  const rocket = page.locator(".star-chart [data-rocket-body]");
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "Reduce motion off" }).click();
  await page.waitForTimeout(100);
  const still = await rocket.boundingBox();
  for (let sample = 0; sample < 6; sample++) {
    await page.waitForTimeout(750);
    const next = await rocket.boundingBox();
    expect(next!.x).toBeCloseTo(still!.x, 1);
    expect(next!.y).toBeCloseTo(still!.y, 1);
  }
});

test("mission controls and flight instruments fit the opening view", async ({
  page,
}) => {
  await page.goto("/");
  const daily = page.getByRole("link", { name: /Launch Daily Expedition/ });
  const endless = page.getByRole("link", { name: /Launch Endless Voyage/ });
  await expect(daily).toBeInViewport({ ratio: 1 });
  await expect(endless).toBeInViewport({ ratio: 1 });
  await daily.click();
  await page.getByRole("radio", { name: "YES", exact: true }).check();
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(
    page.getByRole("button", { name: "Lock prediction" })
  ).toBeInViewport({ ratio: 1 });
  await expect(page.getByTestId("rocket-world")).toBeInViewport({ ratio: 1 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true);
});

test("launchpad navigation and designed recovery stay accessible", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  const daily = page.getByRole("link", { name: /Launch Daily Expedition/ });
  const endless = page.getByRole("link", { name: /Launch Endless Voyage/ });
  await expect(daily).toHaveAttribute("href", "/daily");
  await expect(endless).toHaveAttribute("href", "/endless");
  await page.screenshot({
    path: testInfo.outputPath("launchpad.png"),
    fullPage: true,
  });
  await daily.hover();
  await daily.screenshot({ path: testInfo.outputPath("daily-hover.png") });
  await daily.click();
  await expect(
    page.getByRole("navigation").getByRole("link", { name: /^Daily/ })
  ).toHaveAttribute("aria-current", "page");
  await page.getByRole("radio", { name: "YES", exact: true }).check();
  await page.getByRole("slider").fill("44");
  await page.screenshot({
    path: testInfo.outputPath("daily-aim.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Lock prediction" }).click();
  await expect(
    page.getByRole("heading", { name: "Round result" })
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("daily-result.png"),
    fullPage: true,
  });
  const response = await page.goto("/lost-destination");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "A little off course." })
  ).toBeVisible();
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  await page.screenshot({
    path: testInfo.outputPath("404.png"),
    fullPage: true,
  });
  await page.getByRole("link", { name: "Back to the launchpad" }).click();
  await expect(
    page.getByRole("heading", { name: "Offcourse", exact: true })
  ).toBeVisible();
});
