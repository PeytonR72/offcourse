import { expect, test } from "@playwright/test";

for (const guess of [0, 44, 45, 75, 100]) {
  test(`revealed route labels explain a ${guess}% prediction without early hints`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const scene = page.getByTestId("rocket-world");
    const annotations = scene.locator(".trajectory-annotations");
    await page.getByRole("radio", { name: "YES", exact: true }).check();
    await page.getByRole("slider").fill(String(guess));
    await expect(annotations).toHaveCount(0);
    await page.getByRole("button", { name: "Lock prediction" }).click();
    await expect(scene).toHaveAttribute("data-phase", "resolved");
    await expect(annotations).toBeVisible();
    await expect(annotations).toContainText(
      guess === 44 ? "Perfect · 44%" : `Predicted ${guess}%`
    );
    if (guess !== 44) await expect(annotations).toContainText("Actual 44%");
    // Read all bounds in one layout frame while result focus can scroll the page.
    const { frame, labels } = await scene.evaluate((element) => ({
      frame: element.getBoundingClientRect().toJSON(),
      labels: Array.from(
        element.querySelectorAll(".trajectory-label"),
        (label) => label.getBoundingClientRect().toJSON()
      ),
    }));
    for (const box of labels) {
      expect(box.left).toBeGreaterThanOrEqual(frame.left);
      expect(box.right).toBeLessThanOrEqual(frame.right);
      expect(box.top).toBeGreaterThanOrEqual(frame.top);
      expect(box.bottom).toBeLessThanOrEqual(frame.bottom);
    }
    if (labels.length === 2) {
      const [first, second] = labels;
      expect(first.bottom <= second.top || second.bottom <= first.top).toBe(
        true
      );
    }
    await scene.screenshot({
      path: testInfo.outputPath(`revealed-${guess}.png`),
    });
  });
}

test("context loss after landing restores the earned rocket expression", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const scene = page.getByTestId("rocket-world");
  await expect(scene).toHaveAttribute("data-renderer", "ready");
  await page.getByRole("radio", { name: "YES", exact: true }).check();
  await page.getByRole("slider").fill("44");
  await page.getByRole("button", { name: "Lock prediction" }).click();
  await expect(
    page.getByText("Distance: 100 ly", { exact: true })
  ).toBeVisible();
  await scene
    .locator("canvas")
    .evaluate((canvas) => canvas.dispatchEvent(new Event("webglcontextlost")));
  await expect(scene.locator('[data-rocket-body="happy"]')).toBeVisible();
  await expect(page.getByText("Your prediction: 44% YES")).toBeVisible();
});

test("only the active renderer paints and context loss restores the current fallback", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const scene = page.getByTestId("rocket-world");
  await expect(scene).toHaveAttribute("data-renderer", "ready");
  await expect(scene.locator("svg")).toBeHidden();
  await page.getByRole("radio", { name: "YES", exact: true }).check();
  await page.getByRole("slider").fill("73");
  await scene
    .locator("canvas")
    .evaluate((canvas) => canvas.dispatchEvent(new Event("webglcontextlost")));
  await expect(scene).toHaveAttribute("data-renderer", "unavailable");
  await expect(scene.locator("svg")).toBeVisible();
  await expect(scene).toHaveAttribute("aria-label", /73% YES.*hidden/);
  await page.getByRole("button", { name: "Lock prediction" }).click();
  await expect(page.getByText("Your prediction: 73% YES")).toBeVisible();
});

test("rocket scene persists through aim, reveal and continue", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  await page.emulateMedia({ reducedMotion: "reduce" });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const scene = page.getByTestId("rocket-world");
  await expect(scene).toHaveAttribute("data-renderer", "ready");
  const original = await scene.locator("canvas").elementHandle();
  await expect(scene).toHaveAttribute("data-phase", "answering");
  await page.getByRole("radio", { name: "NO", exact: true }).check();
  await page.getByRole("slider").fill("75");
  await expect(scene).toHaveAttribute("data-phase", "aiming");
  await expect(scene).toHaveAttribute("aria-label", /75% YES.*hidden/);
  await scene.screenshot({ path: testInfo.outputPath("world-aim.png") });
  await expect(scene.locator("canvas")).toHaveScreenshot("world-aim.png", {
    mask: [scene.locator("figcaption"), scene.getByTestId("universe-region")],
    maxDiffPixelRatio: 0.01,
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.getByRole("button", { name: "Lock prediction" }).click();
  await expect(scene).toHaveAttribute("data-phase", "resolved");
  await expect(scene).toHaveAttribute("aria-label", /Actual YES/);
  await scene.screenshot({ path: testInfo.outputPath("world-reveal.png") });
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(scene).toHaveAttribute("data-phase", "answering");
  await expect(scene.locator("canvas")).toHaveCount(1);
  expect(await original?.evaluate((canvas) => canvas.isConnected)).toBe(true);
  expect(errors).toEqual([]);
});

test("practice remains playable when WebGL cannot initialize", async ({
  page,
}, testInfo) => {
  await page.route("**/art/rocket-v1.svg", (route) => route.abort());
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type,
      ...args
    ) {
      if (String(type).includes("webgl")) return null;
      return Reflect.apply(getContext, this, [type, ...args]);
    } as typeof getContext;
  });
  await page.goto("/");
  const scene = page.getByTestId("rocket-world");
  await expect(scene).toHaveAttribute("data-renderer", "unavailable");
  await expect(scene.locator('[data-rocket-body="idle"]')).toBeVisible();
  await scene.screenshot({
    path: testInfo.outputPath("world-fallback-idle.png"),
  });
  await expect(scene.locator("canvas")).toHaveCount(0);
  await expect(page.getByText(/Static view/)).toBeVisible();
  await page.getByRole("radio", { name: "YES", exact: true }).check();
  await page.getByRole("slider").fill("60");
  await page.getByRole("button", { name: "Lock prediction" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Your prediction: 60% YES"
  );
  await page.screenshot({
    path: testInfo.outputPath("world-fallback.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(
    page.getByRole("button", { name: "Lock prediction" })
  ).toBeDisabled();
});
