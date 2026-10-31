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

test("practice can be played with keyboard controls", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  const question = await page.locator("#question").textContent();
  const lock = page.getByRole("button", { name: "Lock prediction" });
  await expect(lock).toBeDisabled();
  await expect(page.getByText(/Actual YES:/)).toHaveCount(0);
  const preferences = page
    .getByRole("group", { name: "Flight preferences" })
    .getByRole("button");
  await expect(preferences.first()).toBeEnabled();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" })
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  // The launchpad and guide precede practice. Traverse them without a pointer.
  for (let index = 0; index < 10; index++) {
    if (
      await page
        .getByRole("radio", { name: "YES", exact: true })
        .evaluate((element) => element === document.activeElement)
    )
      break;
    await page.keyboard.press("Tab");
  }
  await expect(
    page.getByRole("radio", { name: "YES", exact: true })
  ).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("radio", { name: "NO", exact: true })
  ).toBeChecked();
  await page.keyboard.press("Tab");
  const slider = page.getByRole("slider");
  await expect(slider).toBeFocused();
  await page.keyboard.press("Home");
  await expect(slider).toHaveValue("0");
  await page.keyboard.press("End");
  await expect(slider).toHaveValue("100");
  await page.keyboard.press("ArrowLeft");
  await expect(slider).toHaveValue("99");
  await page.keyboard.press("Tab");
  await expect(lock).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Round result" })
  ).toBeFocused();
  await expect(page.getByRole("status")).toContainText(
    "Your prediction: 99% YES"
  );
  await expect(page.getByRole("status")).toContainText("Actual YES:");
  await expect(lock).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath("result.png"),
    fullPage: true,
  });
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Continue" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#question")).not.toHaveText(question!);
  await expect(page.locator("#question")).toBeFocused();
  await expect(lock).toBeDisabled();
  await expect(page.getByText(/Actual YES:/)).toHaveCount(0);
  await page.keyboard.press("Tab");
  const yes = page.getByRole("radio", { name: "YES", exact: true });
  await expect(yes).toBeFocused();
  await page.keyboard.press("Space");
  await expect(yes).toBeChecked();
  await expect(yes).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(slider).toBeFocused();
});

test("pointer aim and rapid lock produce one result", async ({
  page,
  isMobile,
}, testInfo) => {
  await page.goto("/");
  const no = page.getByRole("radio", { name: "NO", exact: true });
  if (isMobile) await no.tap();
  else await no.click();
  const slider = page.getByRole("slider");
  await slider.fill("0");
  await slider.scrollIntoViewIfNeeded();
  const box = await slider.boundingBox();
  if (!box) throw new Error("Slider is missing");
  if (isMobile)
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  else await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  const value = Number(await slider.inputValue());
  expect(value).toBe(50);
  await page.screenshot({
    path: testInfo.outputPath("aim.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Lock prediction" })
    .scrollIntoViewIfNeeded();
  const lockBox = await page
    .getByRole("button", { name: "Lock prediction" })
    .boundingBox();
  if (!lockBox) throw new Error("Lock button is missing");
  await page.mouse.dblclick(
    lockBox.x + lockBox.width / 2,
    lockBox.y + lockBox.height / 2
  );
  await expect(page.getByRole("heading", { name: "Round result" })).toHaveCount(
    1
  );
  await expect(page.getByRole("status")).toContainText(
    `Your prediction: ${value}% YES`
  );
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(
    page.getByRole("button", { name: "Lock prediction" })
  ).toBeDisabled();
});
