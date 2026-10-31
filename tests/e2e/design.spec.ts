import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

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
