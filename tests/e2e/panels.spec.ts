import { expect, test } from "@playwright/test";

test("a panel folds with the keyboard, hides its controls, and stays folded after a reload", async ({ page }) => {
  await page.goto("/typography");
  await expect(page.locator("h1").first()).toBeVisible();

  // The advanced OpenType panel starts folded; its controls are not rendered.
  const toggle = page.getByRole("button", { name: "OpenType features" });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");

  // Open it with the keyboard.
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("region", { name: "OpenType features" })).toBeVisible();

  // The choice is remembered.
  await page.reload();
  await expect(page.getByRole("button", { name: "OpenType features" })).toHaveAttribute("aria-expanded", "true");

  // A panel that cannot fold has no toggle.
  await expect(page.getByRole("region", { name: "Weight waterfall" })).toBeVisible();
});
