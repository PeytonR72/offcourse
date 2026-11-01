import { expect, test } from "@playwright/test";

for (const preference of [
  "normal",
  "system",
  "in-app",
  "unsupported",
] as const) {
  test(`mission navigation preserves play with ${preference} transitions`, async ({
    page,
  }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript((preference) => {
      if (preference === "unsupported") {
        Object.defineProperty(document, "startViewTransition", {
          value: undefined,
        });
        return;
      }
      const native = document.startViewTransition.bind(document);
      document.startViewTransition = (update) => {
        const transition = native(update);
        void transition.ready
          .then(() => {
            const effects = document.getAnimations().flatMap((animation) =>
              animation.effect instanceof KeyframeEffect &&
              animation.effect.pseudoElement
                ? [
                    {
                      pseudo: animation.effect.pseudoElement,
                      duration: animation.effect.getTiming().duration,
                    },
                  ]
                : []
            );
            sessionStorage.setItem(
              "navigation-motion",
              JSON.stringify(effects)
            );
          })
          .catch(() => {});
        return transition;
      };
    }, preference);
    if (preference === "system")
      await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    if (preference === "in-app") {
      await page.getByRole("button", { name: "Reduce motion off" }).click();
    }
    await page.getByRole("link", { name: /Launch Daily Expedition/ }).click();
    await expect(
      page.getByRole("heading", { name: "Daily Expedition", exact: true })
    ).toBeVisible();
    await page.getByRole("radio", { name: "YES", exact: true }).check();
    await expect(
      page.getByRole("button", { name: "Lock prediction" })
    ).toBeEnabled();
    const effects = JSON.parse(
      await page.evaluate(
        () => sessionStorage.getItem("navigation-motion") ?? "[]"
      )
    );
    if (preference === "normal") {
      expect(
        effects.some(
          (effect: { pseudo: string; duration: number }) =>
            effect.pseudo.includes("mission-daily") && effect.duration > 0
        )
      ).toBe(true);
    } else {
      expect(
        effects.filter((effect: { duration: number }) => effect.duration > 0)
      ).toEqual([]);
    }
    await testInfo.attach("navigation-effects", {
      body: JSON.stringify(effects),
      contentType: "application/json",
    });
    await page.goBack();
    await expect(
      page.getByRole("heading", { name: "Offcourse", exact: true })
    ).toBeVisible();
    expect(errors).toEqual([]);
  });
}
