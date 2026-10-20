import { expect, test } from "@playwright/test";

test("skip links jump to the preview and the export pane", async ({ page }) => {
  await page.goto("/effects");
  const preview = page.getByRole("link", { name: "Skip to preview" });
  const output = page.getByRole("link", { name: "Skip to code and exports" });
  await expect(preview).toHaveCount(1);

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(preview).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#studio-preview")).toBeFocused();

  await page.goto("/effects");
  await output.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#studio-output")).toBeFocused();
});
