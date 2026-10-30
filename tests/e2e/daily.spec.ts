import { expect, test } from "@playwright/test";
import { demoCatalog } from "../../src/data/demo-questions";
import { selectDailyDemo } from "../../src/domain/questions";

const at = new Date("2026-10-29T12:00:00Z");
const selection = selectDailyDemo(demoCatalog, at);
if (selection.status !== "ready") throw new Error("Daily fixture unavailable");
const questions = selection.questions;

for (const distance of [0, 500]) {
  test(`daily completes all five destinations for ${distance} ly and prevents replay`, async ({
    page,
  }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.clock.install({ time: at });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await page.getByRole("link", { name: /Play Daily Expedition/ }).click();
    await expect(
      page.getByRole("heading", { name: "Daily Expedition", exact: true })
    ).toBeVisible();
    for (let index = 0; index < 5; index++) {
      await expect(
        page.getByText(`Round ${index + 1} of 5`, { exact: true })
      ).toBeVisible();
      await expect(page.getByRole("heading", { level: 2 })).toHaveText(
        questions[index].question.prompt
      );
      await expect(page.getByText(/Actual YES:/)).toHaveCount(0);
      await page.getByRole("radio", { name: "NO", exact: true }).check();
      const actual = questions[index].distribution.yesPercentage;
      const guess = distance === 500 ? actual : actual < 50 ? 100 : 0;
      await page.getByRole("slider").fill(String(guess));
      if (index === 0)
        await page.screenshot({
          path: testInfo.outputPath(`daily-${distance}-aim.png`),
          fullPage: true,
        });
      await page.getByRole("button", { name: "Lock prediction" }).click();
      if (index < 4) {
        await expect(
          page.getByRole("heading", { name: "Round result" })
        ).toBeFocused();
        await expect(page.getByRole("status")).toContainText(
          `Distance: ${distance === 500 ? 100 : 0} ly`
        );
        await page.getByRole("button", { name: "Continue" }).click();
      }
    }
    await expect(
      page.getByRole("heading", { name: "Daily complete" })
    ).toBeFocused();
    await expect(page.getByRole("status")).toHaveText(
      `${distance} light-years traveled`
    );
    await expect(
      page
        .getByRole("list", { name: "Daily round results" })
        .getByRole("listitem")
    ).toHaveCount(5);
    await expect(
      page.getByText("Illustrative results", { exact: true })
    ).toBeVisible();
    await expect(page.getByText(/Already played today/)).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath(`daily-${distance}-summary.png`),
      fullPage: true,
    });
    await page.reload();
    await expect(page.getByRole("status")).toHaveText(
      `${distance} light-years traveled`
    );
    await expect(page.getByRole("slider")).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true);
    expect(errors).toEqual([]);
  });
}

test("daily reload preserves input and settles a locked prediction once", async ({
  page,
}) => {
  await page.clock.install({ time: at });
  await page.clock.pauseAt(new Date("2026-10-29T12:00:01Z"));
  await page.goto("/daily");
  await page.getByRole("radio", { name: "YES", exact: true }).check();
  await page
    .getByRole("slider")
    .fill(String(questions[0].distribution.yesPercentage));
  await page.reload();
  await expect(
    page.getByRole("radio", { name: "YES", exact: true })
  ).toBeChecked();
  await expect(page.getByRole("slider")).toHaveValue(
    String(questions[0].distribution.yesPercentage)
  );
  await page.getByRole("button", { name: "Lock prediction" }).click();
  await expect(page.getByText(/Actual YES:/)).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Round result" })
  ).toBeVisible();
  await expect(
    page.getByText("Total distance: 100 ly / 500 ly", { exact: true })
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Total distance: 100 ly / 500 ly", { exact: true })
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Round 2 of 5", { exact: true })).toBeVisible();
});

test("an open daily page unlocks the new UTC expedition at midnight", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-29T23:59:58Z") });
  await page.clock.pauseAt(new Date("2026-10-29T23:59:59Z"));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/daily");
  await page.getByRole("radio", { name: "YES", exact: true }).check();
  await page.getByRole("slider").fill("73");
  await expect(
    page.getByText("2026-10-29 · UTC expedition", { exact: true })
  ).toBeVisible();
  await page.clock.runFor(1100);
  await expect(
    page.getByText("2026-10-30 · UTC expedition", { exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Lock prediction" })
  ).toBeDisabled();
  await expect(page.getByText("Round 1 of 5", { exact: true })).toBeVisible();
  await expect(page.locator("time")).toHaveAttribute(
    "datetime",
    "2026-10-31T00:00:00.000Z"
  );
  await page.reload();
  await expect(
    page.getByText("2026-10-30 · UTC expedition", { exact: true })
  ).toBeVisible();
});

test("unavailable browser storage leaves a clear recovery path to practice", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error("Storage is unavailable");
    };
  });
  await page.goto("/daily");
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Daily progress could not be saved or restored"
  );
  await expect(page.getByRole("slider")).toHaveCount(0);
  await page.getByRole("link", { name: "play practice", exact: true }).click();
  await expect(
    page.getByRole("radio", { name: "YES", exact: true })
  ).toBeVisible();
});
