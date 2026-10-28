import { expect, test } from "@playwright/test";

/** The palette is short until something is typed, and remembers what was chosen. */
test("the palette opens short, remembers a choice and shows the rest as you type", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1").first()).toBeVisible();

  const items = page.locator("[cmdk-item]");
  await page.keyboard.press("ControlOrMeta+k");
  const palette = page.getByRole("dialog");
  await expect(palette).toBeVisible();

  // Nothing typed: studios and a few actions, under about 30 items, with no recents yet and none of the long tail.
  await expect(items.first()).toBeVisible();
  expect(await items.count()).toBeLessThan(30);
  await expect(palette.getByText("Recent", { exact: true })).toHaveCount(0);
  await expect(palette.getByText("View source on GitHub")).toHaveCount(0);
  await expect(palette.getByText("Download brand book (PDF)")).toHaveCount(0);

  // Choose a studio: it is the first recent the next time.
  await palette.getByRole("option", { name: /^Color Studio/ }).click();
  await expect(page).toHaveURL(/\/colors$/);
  await page.keyboard.press("ControlOrMeta+k");
  await expect(palette.getByText("Recent", { exact: true })).toBeVisible();
  await expect(palette.getByRole("option").first()).toContainText("Color Studio");

  // Typing brings back what was left out.
  await page.keyboard.type("source");
  await expect(palette.getByText("View source on GitHub")).toBeVisible();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.press("Backspace");
  await expect(palette.getByText("View source on GitHub")).toHaveCount(0);

  // Recents can be cleared from the palette.
  await palette.getByRole("option", { name: "Clear recent choices" }).click();
  await expect(palette.getByText("Recent", { exact: true })).toHaveCount(0);
});
