import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Run only with the isolated PostgreSQL fixture runner (never a hosted database).
test.skip(!process.env.PLAY_TEST_DATABASE_URL, "Use npm run test:e2e:server");

test("readiness probes qualified coverage without answers or identifiers", async ({
  request,
}) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toBe("no-store");
  expect(await response.json()).toEqual({ status: "ok", play: "ready" });
});

test("real HTTP manifests hide targets; daily plays five rounds and resumes the official total", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const response = page.waitForResponse(
    (r) => r.url().endsWith("/api/play") && r.request().method() === "POST"
  );
  await page.goto("/play");
  const manifest = await response;
  expect(manifest.status()).toBe(200);
  expect(manifest.headers()["cache-control"]).toBe("no-store");
  expect(await manifest.text()).not.toMatch(
    /yesPercentage|sampleSize|participant/
  );
  await expect(page.getByRole("slider")).toBeVisible();
  await expect(
    page.getByRole("slider", {
      name: "What percentage of poll respondents chose YES?",
    })
  ).toBeVisible();
  await expect(
    page.getByText("Licensed poll results", { exact: true })
  ).toBeVisible();
  await expect(page.getByText(/Sample:/)).toHaveCount(0);
  await expect(page.getByText("Demo flight", { exact: true })).toHaveCount(0);
  await expect(page.getByText(/Actual YES:/)).toHaveCount(0);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations
  ).toEqual([]);
  await page.screenshot({
    path: testInfo.outputPath("server-aim.png"),
    fullPage: true,
  });
  for (let index = 0; index < 5; index++) {
    if (index)
      await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByRole("radio", { name: "NO", exact: true }).check();
    await page.getByRole("slider").fill("57");
    const locked = page.waitForResponse((r) => r.url().endsWith("/lock"));
    await page.getByRole("button", { name: "Lock prediction" }).click();
    const reply = await (await locked).json();
    expect(reply.play.results).toHaveLength(index + 1);
    expect(reply.play.totalDistance).toBe(50 * (index + 1));
    await expect(page.getByText("Actual YES: 67%")).toBeVisible();
    await expect(page.getByText(/Sample: 100/)).toBeVisible();
  }
  await expect(page.getByText("Daily Expedition complete.")).toBeVisible();
  await expect(page.getByText(/Distance: 250 ly/)).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations
  ).toEqual([]);
  await page.reload();
  await expect(page.getByText("Daily Expedition complete.")).toBeVisible();
  await expect(page.getByRole("slider")).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath("server-complete.png"),
    fullPage: true,
  });
});

test("a committed lock with a lost response is recovered after reload without duplicate credit", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/play?mode=endless");
  await page.getByRole("radio", { name: "YES", exact: true }).check();
  await page.getByRole("slider").fill("67");
  let original: string | null = null;
  await page.route("**/api/play/*/lock", async (route) => {
    original = route.request().postData();
    const accepted = await route.fetch();
    expect(accepted.status()).toBe(200);
    // The database committed, but the browser never receives the response.
    await route.abort("connectionreset");
  });
  await page.getByRole("button", { name: "Lock prediction" }).click();
  await expect(
    page.getByRole("button", { name: "Retry connection" })
  ).toBeVisible();
  await expect(page.getByRole("slider")).toHaveCount(0);
  await expect(page.getByText(/Actual YES:/)).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath("server-offline.png"),
    fullPage: true,
  });
  await page.unroute("**/api/play/*/lock");
  const retry = page.waitForRequest((r) => r.url().endsWith("/lock"));
  await page.reload();
  expect((await retry).postData()).toBe(original);
  await expect(page.getByText("Actual YES: 67%")).toBeVisible();
  await expect(
    page.getByText(/Distance: 100 ly · Destinations reached: 1/)
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("radio", { name: "YES", exact: true }).check();
  await page.getByRole("slider").fill("56");
  await page.getByRole("button", { name: "Lock prediction" }).click();
  await expect(page.getByText("Voyage ended — off course.")).toBeVisible();
  await expect(
    page.getByText(/Distance: 100 ly · Destinations reached: 1/)
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue", exact: true })
  ).toHaveCount(0);
  await page.getByRole("button", { name: "New voyage", exact: true }).click();
  await expect(page.getByRole("slider")).toBeVisible();
  await expect(page.locator("#question")).not.toHaveText(
    "Synthetic test question 1?"
  );
  await expect(page.locator("#question")).not.toHaveText(
    "Synthetic test question 2?"
  );
});

test("content shortage explains availability and keeps demo practice reachable", async ({
  page,
}, testInfo) => {
  await page.route("**/api/play", (route) =>
    route.fulfill({ status: 503, json: { status: "not_ready" } })
  );
  await page.goto("/play");
  await expect(
    page.getByText(/Qualified content is being prepared/)
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Check availability" })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Offcourse · Demo practice" })
  ).toBeVisible();
  await expect(page.getByRole("slider")).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath("server-content-waiting.png"),
    fullPage: true,
  });
});

test("concurrent requests serialize locks and cross-installation access returns no answers", async ({
  request,
}) => {
  const installationId = crypto.randomUUID();
  const requestId = crypto.randomUUID();
  const starts = await Promise.all(
    [1, 2].map(() =>
      request.post("/api/play", {
        data: { installationId, requestId, mode: "daily" },
      })
    )
  );
  const runs = await Promise.all(starts.map((r) => r.json()));
  expect(runs[0]).toEqual(runs[1]);
  const path = `/api/play/${runs[0].play.id}/lock`;
  const data = {
    installationId,
    roundIndex: 0,
    answer: "no",
    guessPercentage: 57,
  };
  const locks = await Promise.all(
    [1, 2].map(() => request.post(path, { data }))
  );
  const results = await Promise.all(locks.map((r) => r.json()));
  expect(results[0]).toEqual(results[1]);
  expect(results[0].play.totalDistance).toBe(50);
  expect(results[0].play.results).toHaveLength(1);
  const outsider = await request.post(path, {
    data: { ...data, installationId: crypto.randomUUID() },
  });
  expect(await outsider.json()).toEqual({ status: "unavailable" });
  expect(
    (
      await request.post(path, {
        data: { ...data, guessPercentage: 67, score: 100 },
      })
    ).status()
  ).toBe(400);
});
