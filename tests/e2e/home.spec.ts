import { expect, test } from "@playwright/test";

test("home page introduces Offcourse and clearly identifies the prototype", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("Offcourse");
  await expect(
    page.getByRole("heading", { name: "Offcourse", exact: true })
  ).toBeVisible();
  await expect(
    page.getByText("Prototype in progress", { exact: true })
  ).toBeVisible();
  await expect(
    page.getByText("Illustrative results", { exact: true })
  ).toBeVisible();
  await expect(page.getByRole("main")).toBeInViewport();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
  expect(errors).toEqual([]);

  await page.screenshot({
    path: testInfo.outputPath("home.png"),
    fullPage: true,
  });
});
