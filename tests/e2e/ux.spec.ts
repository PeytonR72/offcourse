import { expect, test, devices } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const layouts = [
  { name: "narrow", width: 360, height: 740, touch: true },
  { name: "iphone", width: 393, height: 852, touch: true },
  { name: "tablet", width: 768, height: 1024, touch: true },
  { name: "desktop", width: 1440, height: 900, touch: false },
  { name: "landscape", width: 844, height: 390, touch: true },
];

test.describe("T13 device matrix", () => {
  test.skip(({ isMobile }) => Boolean(isMobile));
  for (const layout of layouts) {
    test(`${layout.name} has readable controls and preserves aim through rotation and reload`, async ({
      browser,
    }, testInfo) => {
      const context = await browser.newContext({
        ...devices[layout.touch ? "iPhone 13" : "Desktop Chrome"],
        viewport: { width: layout.width, height: layout.height },
        reducedMotion: "reduce",
        baseURL: "http://localhost:3100",
      });
      const page = await context.newPage();
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const measurements = [];
      try {
        for (const route of ["/", "/daily", "/endless"]) {
          await page.goto(route);
          await page.getByRole("radio", { name: "NO", exact: true }).check();
          const slider = page.getByRole("slider");
          await slider.fill("73");
          await expect(page.getByTestId("rocket-world")).toHaveAttribute(
            "data-renderer",
            "ready"
          );
          if (layout.name === "landscape" && route === "/")
            await expect(page.locator(".world-viewport")).toHaveScreenshot(
              "landscape-world.png",
              { maxDiffPixelRatio: 0.01 }
            );
          const sizes = await page
            .locator(
              "button:visible, a:visible, input[type=range], label:has(input[type=radio])"
            )
            .evaluateAll((elements) =>
              elements.map((element) => {
                const rect = element.getBoundingClientRect();
                return {
                  label:
                    element.textContent?.trim() ||
                    element.getAttribute("aria-label") ||
                    "prediction",
                  width: rect.width,
                  height: rect.height,
                };
              })
            );
          for (const size of sizes) {
            expect(size.height, size.label).toBeGreaterThanOrEqual(44);
            expect(size.width, size.label).toBeGreaterThanOrEqual(44);
          }
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth
            )
          ).toBe(true);
          const smallText = await page
            .locator(
              "main p, main label, main button, main a, figcaption, [data-testid=universe-region]"
            )
            .evaluateAll((elements) =>
              elements
                .filter(
                  (element) =>
                    parseFloat(getComputedStyle(element).fontSize) < 12
                )
                .map((element) => element.textContent)
            );
          expect(smallText).toEqual([]);
          measurements.push({ route, sizes });
          await page.screenshot({
            path: testInfo.outputPath(
              `${route.slice(1) || "practice"}-${layout.name}.png`
            ),
            fullPage: true,
          });
          await page
            .getByRole("button", { name: "Pause", exact: true })
            .click();
          await expect(
            page.getByRole("button", { name: "Resume" })
          ).toBeFocused();
          if (route === "/daily")
            await page.screenshot({
              path: testInfo.outputPath(`pause-${layout.name}.png`),
              fullPage: true,
            });
          await page.setViewportSize({
            width: layout.height,
            height: layout.width,
          });
          await page.getByRole("button", { name: "Resume" }).click();
          await expect(slider).toHaveValue("73");
          await expect(
            page.getByRole("radio", { name: "NO", exact: true })
          ).toBeChecked();
          if (route !== "/") {
            await page.reload();
            await expect(slider).toHaveValue("73");
            await expect(
              page.getByRole("radio", { name: "NO", exact: true })
            ).toBeChecked();
          }
          await page.setViewportSize({
            width: layout.width,
            height: layout.height,
          });
          await page.getByRole("button", { name: "Lock prediction" }).click();
          await expect(page.getByText(/Actual YES:/)).toBeVisible();
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth
            )
          ).toBe(true);
          await page.screenshot({
            path: testInfo.outputPath(
              `result-${route.slice(1) || "practice"}-${layout.name}.png`
            ),
            fullPage: true,
          });
        }
        expect(errors).toEqual([]);
        await mkdir(testInfo.outputDir, { recursive: true });
        await writeFile(
          testInfo.outputPath("measurements.json"),
          JSON.stringify(measurements, null, 2)
        );
      } finally {
        await context.close();
      }
    });
  }
});

test("pause freezes a locked flight; hidden tabs require explicit resume", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await page.getByRole("radio", { name: "YES", exact: true }).check();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.getByRole("button", { name: "Lock prediction" }).click();
  await page.clock.runFor(400);
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await page.clock.runFor(5000);
  await expect(page.getByText(/Actual YES:/)).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Flight paused" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Resume" }).click();
  await page.clock.runFor(400);
  await expect(page.getByText(/Actual YES:/)).toHaveCount(0);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.runFor(5000);
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
  await page.getByRole("button", { name: "Resume" }).click();
  await page.clock.runFor(1500);
  await expect(
    page.getByRole("heading", { name: "Round result" })
  ).toBeFocused();
  await expect(page.getByText("Your prediction: 50% YES")).toBeVisible();
});

test("storage error recovery offers a full touch target", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error("Unavailable");
    };
  });
  await page.goto("/endless");
  const recovery = page.getByRole("link", {
    name: "play practice",
    exact: true,
  });
  await expect(page.getByRole("main").getByRole("alert")).toBeVisible();
  const box = await recovery.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  await recovery.click();
  await expect(
    page.getByRole("radio", { name: "YES", exact: true })
  ).toBeVisible();
});

test("touch dragging aims precisely without scrolling the page", async ({
  page,
  context,
}) => {
  test.skip(!test.info().project.use.isMobile);
  await page.goto("/daily");
  await page.getByRole("radio", { name: "NO", exact: true }).check();
  const slider = page.getByRole("slider");
  await slider.scrollIntoViewIfNeeded();
  const box = (await slider.boundingBox())!;
  const cdp = await context.newCDPSession(page);
  const y = box.y + box.height / 2;
  const scroll = await page.evaluate(() => scrollY);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: box.x + box.width / 2, y }],
  });
  for (const fraction of [0.6, 0.7, 0.8, 0.9]) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: box.x + box.width * fraction, y }],
    });
  }
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  expect(Number(await slider.inputValue())).toBeGreaterThanOrEqual(88);
  expect(await page.evaluate(() => scrollY)).toBe(scroll);
  const prediction = await slider.inputValue();
  await page.reload();
  await expect(slider).toHaveValue(prediction);
});

test("slow client startup shows a clear loading state for each saved mode", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL: "http://localhost:3100",
  });
  const page = await context.newPage();
  try {
    await page.goto("/daily");
    await expect(page.getByRole("status")).toHaveText(
      "Loading today’s expedition…"
    );
    await page.goto("/endless");
    await expect(page.getByRole("status")).toHaveText("Preparing your voyage…");
  } finally {
    await context.close();
  }
});

test("reduced motion restores the stationary fallback after idle movement", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const scene = page.getByTestId("rocket-world");
  await expect(scene).toHaveAttribute("data-renderer", "ready");
  await expect(scene).toHaveAttribute("data-reduced-motion", "true");
  const rocket = scene.locator("svg > g[transform]");
  const stationary = await rocket.getAttribute("transform");
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(scene).toHaveAttribute("data-reduced-motion", "false");
  await page.clock.runFor(300);
  expect(await rocket.getAttribute("transform")).not.toBe(stationary);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(scene).toHaveAttribute("data-reduced-motion", "true");
  await expect(rocket).toHaveAttribute("transform", stationary!);
});
