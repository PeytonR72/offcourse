import type { Page } from "@playwright/test";

/** Phones keep flight preferences in the header menu; open it when needed. */
export async function preference(page: Page, name: string | RegExp) {
  const menu = page.getByRole("button", { name: "Menu and preferences" });
  if (
    (await menu.isVisible()) &&
    (await menu.getAttribute("aria-expanded")) !== "true"
  )
    await menu.click();
  return page.getByRole("button", { name, exact: true });
}
