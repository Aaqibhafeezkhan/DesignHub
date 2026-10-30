import { expect, test } from "@playwright/test";

/**
 * Screenshots of the home page and five studios at three widths in light and dark, and of the phone pane bar, so a layout that looks
 * wrong fails even when every behaviour test passes. They run only in the visual workflow (VISUAL=1), on its
 * Linux image, where the images were made: other machines draw text a little differently. To update them after
 * an intended change, run that workflow by hand with "update" ticked, and read the new images in the commit.
 */
test.skip(process.env.VISUAL !== "1", "Screenshots are compared only in the visual workflow (VISUAL=1)");

const pages = [
  { name: "home", path: "/" },
  { name: "colors", path: "/colors" },
  { name: "effects", path: "/effects" },
  { name: "backgrounds", path: "/backgrounds" },
  { name: "logo", path: "/logo" },
  { name: "brand", path: "/brand" },
];
const widths = [375, 768, 1280];
const themes = ["light", "dark"] as const;

for (const { name, path } of pages) {
  for (const width of widths) {
    for (const theme of themes) {
      test(`${name} at ${width}px in ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
        await page.addInitScript((value) => window.localStorage.setItem("theme", value), theme);
        await page.goto(path);
        await expect(page.locator("h1").first()).toBeVisible();
        // Fonts and the first paint have settled, and nothing is loading.
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
        await expect(page).toHaveScreenshot(`${name}-${width}-${theme}.png`);
      });
    }
  }
}

// The phone pane bar, with each pane of one studio open in turn.
for (const pane of ["Controls", "Preview", "Output"] as const) {
  for (const theme of themes) {
    test(`effects pane bar, ${pane} open, at 375px in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 900 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.addInitScript((value) => window.localStorage.setItem("theme", value), theme);
      await page.goto("/effects");
      await expect(page.locator("h1").first()).toBeVisible();
      await page.getByRole("navigation", { name: "Studio panes" }).getByRole("button", { name: pane }).click();
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
      await expect(page).toHaveScreenshot(`effects-pane-${pane.toLowerCase()}-${theme}.png`);
    });
  }
}
