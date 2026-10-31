import { expect, test } from "@playwright/test";

for (const missingAsset of [false, true]) {
  test(`original rocket ${missingAsset ? "recovers from missing art" : "loads its atlas"} at portrait and desktop sizes`, async ({
    page,
  }, testInfo) => {
    if (testInfo.project.name === "mobile")
      await page.setViewportSize({ width: 320, height: 740 });
    if (missingAsset)
      await page.route("**/art/rocket-v1.svg", (route) => route.abort());
    const errors: string[] = [];
    // Compare the art at rest; idle breathing is covered by the motion seam.
    await page.emulateMedia({ reducedMotion: "reduce" });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    const scene = page.getByTestId("rocket-world");
    await expect(scene).toHaveAttribute("data-renderer", "ready");
    await expect(scene).toHaveAttribute("data-expression", "idle");
    await expect(scene.locator("canvas")).toHaveAttribute(
      "data-rocket-art",
      missingAsset ? "embedded" : "asset"
    );
    // The same 47 × 31 pixel silhouette is used by GPU and fallback renderers.
    await scene.scrollIntoViewIfNeeded();
    const bounds = await scene.locator("[data-rocket-body]").boundingBox();
    expect(bounds?.width).toBeGreaterThanOrEqual(30);
    expect(bounds?.height).toBeGreaterThanOrEqual(20);
    await expect(page).toHaveScreenshot("rocket-idle.png", {
      clip: bounds!,
      maxDiffPixelRatio: 0.01,
    });
    await scene.screenshot({
      path: testInfo.outputPath(missingAsset ? "embedded.png" : "idle.png"),
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.getByRole("radio", { name: "YES", exact: true }).check();
    await page.getByRole("slider").fill("44");
    await page.getByRole("button", { name: "Lock prediction" }).click();
    await expect(scene).toHaveAttribute("data-expression", "happy");
    await expect(page.getByRole("status")).toContainText("Distance: 100 ly");
    await scene.screenshot({
      path: testInfo.outputPath(
        missingAsset ? "embedded-happy.png" : "happy.png"
      ),
    });
    expect(errors).toEqual([]);
  });
}
