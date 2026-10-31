import { expect, test } from "@playwright/test";
import { writeFile } from "node:fs/promises";

// DOM tracing changes frame cadence. Keep this probe uninstrumented, including retries.
test.use({ trace: "off" });

test("universe stays inside its scene and renders a responsive flight", async ({
  page,
  context,
}, testInfo) => {
  await page.goto("/");
  const scene = page.getByTestId("rocket-world");
  await expect(scene).toHaveAttribute("data-renderer", "ready");
  await expect(scene).toHaveAttribute("aria-label", /Home orbit/);
  const originalViewport = page.viewportSize()!;
  for (const viewport of [originalViewport, { width: 320, height: 740 }]) {
    await page.setViewportSize(viewport);
    const caption = (await scene.locator("figcaption").boundingBox())!;
    for (const planet of await scene.locator("[data-planet]").all()) {
      const bounds = (await planet.boundingBox())!;
      expect(bounds.y + bounds.height).toBeLessThan(caption.y);
    }
  }
  await page.setViewportSize(originalViewport);
  await page.getByRole("radio", { name: "YES", exact: true }).check();
  await page.getByRole("slider").fill("44");
  await expect(page.getByText(/Actual YES:/)).toHaveCount(0);
  const sceneBounds = (await scene.boundingBox())!;
  const headingBounds = (await page.locator("#question").boundingBox())!;
  expect(sceneBounds.y + sceneBounds.height).toBeLessThan(headingBounds.y);
  const client = await context.newCDPSession(page);
  // Hosted CI uses software graphics on shared CPUs. Keep its responsiveness
  // guard unthrottled; device profiling records the separate 4× desktop probe.
  const cpuThrottle = process.env.CI ? 1 : 4;
  await client.send("Emulation.setCPUThrottlingRate", { rate: cpuThrottle });
  const [frames] = await Promise.all([
    page.evaluate(
      () =>
        new Promise<number[]>((resolve) => {
          const gaps: number[] = [];
          const start = performance.now();
          let previous = start;
          const sample = (now: number) => {
            gaps.push(now - previous);
            previous = now;
            if (now - start < 2200) requestAnimationFrame(sample);
            else resolve(gaps);
          };
          requestAnimationFrame(sample);
        })
    ),
    page.getByRole("button", { name: "Lock prediction" }).click(),
  ]);
  await client.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  await expect(scene).toHaveAttribute("data-phase", "resolved");
  await expect(page.getByRole("status")).toContainText("Distance: 100 ly");
  expect(frames.length).toBeGreaterThan(10);
  const sorted = [...frames].sort((a, b) => a - b);
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const median = sorted[Math.floor(sorted.length / 2)];
  const performancePath = testInfo.outputPath("performance-smoke.json");
  await writeFile(
    performancePath,
    JSON.stringify(
      {
        viewport: page.viewportSize(),
        cpuThrottle,
        frames: frames.length,
        medianGapMs: median,
        p95GapMs: p95,
      },
      null,
      2
    )
  );
  await testInfo.attach("performance-smoke.json", {
    path: performancePath,
    contentType: "application/json",
  });
  await page.screenshot({
    path: testInfo.outputPath("universe-flight.png"),
    fullPage: true,
  });
  expect(p95).toBeLessThan(100);
  expect(median).toBeLessThan(50);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true);
});
