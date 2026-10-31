import { chromium, devices } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

// A measured browser-cadence probe, not a physical-phone or GPU benchmark.
const baseURL = new URL(process.env.PROFILE_BASE_URL ?? "http://localhost:3100")
  .origin;
const output = "test-results/flight-profile";
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const report = {
  capturedAt: new Date().toISOString(),
  browser: browser.version(),
  platform: process.platform,
  samples: [],
};
try {
  for (const profile of [
    { name: "desktop", device: "Desktop Chrome", rate: 1 },
    { name: "mobile-emulation", device: "Pixel 7", rate: 4 },
  ]) {
    const context = await browser.newContext({
      ...devices[profile.device],
      baseURL,
      reducedMotion: "no-preference",
    });
    const page = await context.newPage();
    const client = await context.newCDPSession(page);
    await client.send("Emulation.setCPUThrottlingRate", { rate: profile.rate });
    try {
      for (const guess of [44, 54, 55]) {
        await page.goto("/");
        await page.getByTestId("rocket-world").waitFor();
        await page.waitForFunction(
          () =>
            document
              .querySelector("[data-testid=rocket-world]")
              ?.getAttribute("data-renderer") === "ready"
        );
        await page.getByRole("radio", { name: "YES", exact: true }).check();
        await page.getByRole("slider").fill(String(guess));
        const [gaps] = await Promise.all([
          page.evaluate(
            () =>
              new Promise((resolve) => {
                const intervals = [];
                let previous;
                let start;
                const tick = (now) => {
                  start ??= now;
                  if (previous !== undefined) intervals.push(now - previous);
                  previous = now;
                  if (now - start < 2200) requestAnimationFrame(tick);
                  else resolve(intervals);
                };
                requestAnimationFrame(tick);
              })
          ),
          page.getByRole("button", { name: "Lock prediction" }).click(),
        ]);
        await page.getByRole("heading", { name: "Round result" }).waitFor();
        const sorted = [...gaps].sort((a, b) => a - b);
        report.samples.push({
          profile: profile.name,
          cpuThrottle: profile.rate,
          viewport: page.viewportSize(),
          guess,
          result: await page.getByRole("status").textContent(),
          frameIntervals: gaps.length,
          elapsedMs: gaps.reduce((sum, gap) => sum + gap, 0),
          meanFps:
            (1000 * gaps.length) / gaps.reduce((sum, gap) => sum + gap, 0),
          medianGapMs: sorted[Math.floor(sorted.length * 0.5)],
          p95GapMs: sorted[Math.floor(sorted.length * 0.95)],
          gapsOver33Ms: gaps.filter((gap) => gap > 33.34).length,
        });
        await page.screenshot({
          path: join(output, `${profile.name}-${guess}.png`),
          fullPage: true,
        });
      }
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
await writeFile(
  join(output, "profile.json"),
  JSON.stringify(report, null, 2) + "\n"
);
console.log(JSON.stringify(report, null, 2));
