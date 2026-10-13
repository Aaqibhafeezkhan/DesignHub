import { expect, test, type Page } from "@playwright/test";

import { studios } from "../../lib/navigation";

/** Every page a visitor can open: the home page and each studio. */
const routes: { name: string; href: string }[] = [
  { name: "Home", href: "/" },
  ...studios.map((studio) => ({ name: studio.title, href: studio.href })),
];

/** Collects uncaught page errors and console errors so a test can fail on them. */
function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  return errors;
}

test.describe("routes", () => {
  for (const route of routes) {
    test(`${route.name} (${route.href}) loads with a heading and no errors`, async ({ page }) => {
      const errors = watchErrors(page);
      const response = await page.goto(route.href);
      expect(response?.status()).toBe(200);

      await expect(page.locator("h1").first()).toBeVisible();
      await expect(page.locator("h1").first()).not.toBeEmpty();

      // One light interaction: open the last tab of the studio, when it has tabs.
      const tabs = page.getByRole("tab");
      if ((await tabs.count()) > 1) await tabs.last().click();
      await page.waitForLoadState("networkidle");

      expect(errors).toEqual([]);
    });
  }

  test("an unknown route shows the not-found page", async ({ page }) => {
    const response = await page.goto("/this-route-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.locator("h1").first()).toBeVisible();
  });
});

test.describe("go shortcuts", () => {
  for (const studio of studios) {
    test(`g ${studio.shortcut} opens ${studio.title}`, async ({ page }) => {
      await page.goto("/brand");
      await expect(page.locator("h1").first()).toBeVisible();
      // The heading is server-rendered; the theme label changes after shell hydration.
      await expect(page.getByRole("button", { name: /^Switch to (light|dark) theme$/ })).toBeVisible();
      await page.keyboard.press("g");
      await page.keyboard.press(studio.shortcut);
      await expect(page).toHaveURL(new RegExp(`${studio.href}$`));
      await expect(page.locator("h1").first()).toBeVisible();
    });
  }
});
