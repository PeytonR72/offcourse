import { expect, test, type Page } from "@playwright/test";
import { demoCatalog } from "../../src/data/demo-questions";

async function currentQuestion(page: Page) {
  const heading = page.getByRole("heading", { level: 2 });
  await expect(page.getByRole("slider")).toBeVisible();
  const prompt = await heading.textContent();
  const entry = demoCatalog.entries.find(
    ({ question }) => question.prompt === prompt
  );
  if (!entry) throw new Error(`Unknown demo prompt: ${prompt}`);
  return entry;
}

async function predict(page: Page, error: number) {
  const entry = await currentQuestion(page);
  const actual = entry.distribution.yesPercentage;
  await expect(page.getByText(/Actual YES:/)).toHaveCount(0);
  await page.getByRole("radio", { name: "NO", exact: true }).check();
  await page
    .getByRole("slider")
    .fill(String(actual > 50 ? actual - error : actual + error));
  await page.getByRole("button", { name: "Lock prediction" }).click();
  return entry;
}

test("10 survives, 11 ends, and restart preserves bests across reload", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("link", { name: /Play Endless Voyage/ }).click();
  await expect(
    page.getByRole("heading", { name: "Endless Voyage", exact: true })
  ).toBeVisible();
  const first = await currentQuestion(page);
  await page.screenshot({
    path: testInfo.outputPath("endless-aim.png"),
    fullPage: true,
  });
  await predict(page, 10);
  await expect(
    page.getByRole("heading", { name: "Round result" })
  ).toBeFocused();
  await expect(
    page.getByText("Current streak: 1", { exact: true })
  ).toBeVisible();
  await expect(
    page.getByText("Run distance: 50 ly", { exact: true })
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  const second = await currentQuestion(page);
  expect(second.question.id).not.toBe(first.question.id);
  await predict(page, 11);
  await expect(
    page.getByRole("heading", { name: "Voyage ended" })
  ).toBeFocused();
  await expect(page.getByText("Last round distance: 0 ly")).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue" })).toHaveCount(0);
  await expect(page.getByRole("slider")).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath("endless-loss.png"),
    fullPage: true,
  });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Voyage ended" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Restart voyage" }).click();
  await expect(
    page.getByText("Current streak: 0", { exact: true })
  ).toBeFocused();
  await expect(
    page.getByText("Run distance: 0 ly", { exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Lock prediction" })
  ).toBeDisabled();
  await expect(page.getByText("Best streak: 1", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Best distance: 50 ly", { exact: true })
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Current streak: 0", { exact: true })
  ).toBeVisible();
  await expect(page.getByText("Best streak: 1", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Illustrative results", { exact: true })
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("all 40 demo questions complete once without a fake loss", async ({
  page,
}, testInfo) => {
  test.setTimeout(90000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/endless");
  const seen = new Set<string>();
  for (let index = 0; index < 40; index++) {
    const entry = await predict(page, 0);
    expect(seen.has(entry.question.id)).toBe(false);
    seen.add(entry.question.id);
    if (index < 39) {
      await expect(
        page.getByRole("heading", { name: "Round result" })
      ).toBeVisible();
      await page.getByRole("button", { name: "Continue" }).click();
    }
  }
  await expect(
    page.getByRole("heading", { name: "Voyage complete" })
  ).toBeFocused();
  await expect(page.getByRole("status")).toContainText(
    "end of the question pool"
  );
  await expect(
    page.getByText("Current streak: 40", { exact: true })
  ).toBeVisible();
  await expect(
    page.getByText("Run distance: 4000 ly", { exact: true })
  ).toBeVisible();
  await expect(
    page.getByText("Best streak: 40", { exact: true })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue" })).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath("endless-complete.png"),
    fullPage: true,
  });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Voyage complete" })
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth
    )
  ).toBe(true);
});

test("reload preserves input and settles a locked prediction once", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-29T12:00:00Z") });
  await page.clock.pauseAt(new Date("2026-10-29T12:00:01Z"));
  await page.goto("/endless");
  const entry = await currentQuestion(page);
  await page.getByRole("radio", { name: "YES", exact: true }).check();
  await page.getByRole("slider").fill(String(entry.distribution.yesPercentage));
  await page.reload();
  await expect(
    page.getByRole("radio", { name: "YES", exact: true })
  ).toBeChecked();
  await expect(page.getByRole("slider")).toHaveValue(
    String(entry.distribution.yesPercentage)
  );
  await page.getByRole("button", { name: "Lock prediction" }).click();
  await expect(page.getByText(/Actual YES:/)).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Round result" })
  ).toBeVisible();
  await expect(
    page.getByText("Run distance: 100 ly", { exact: true })
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Current streak: 1", { exact: true })
  ).toBeVisible();
  await expect(
    page.getByText("Run distance: 100 ly", { exact: true })
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  expect((await currentQuestion(page)).question.id).not.toBe(entry.question.id);
});

test("unavailable storage provides a recovery path", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error("Unavailable storage");
    };
  });
  await page.goto("/endless");
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Voyage progress could not be saved or restored"
  );
  await page.getByRole("link", { name: "play practice", exact: true }).click();
  await expect(page.getByRole("slider")).toBeVisible();
});
