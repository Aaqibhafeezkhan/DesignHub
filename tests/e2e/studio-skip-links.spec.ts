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

test.describe("on a phone, one pane shows at a time", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("the bar switches panes and the skip links open a hidden one", async ({ page }) => {
    await page.goto("/effects");
    const bar = page.getByRole("navigation", { name: "Studio panes" });
    await expect(bar).toBeVisible();
    const controls = page.locator('section[aria-label="Controls"]');
    const preview = page.locator("#studio-preview");
    const output = page.locator("#studio-output");

    await expect(controls).toBeVisible();
    await expect(preview).toBeHidden();
    await expect(output).toBeHidden();

    await bar.getByRole("button", { name: "Preview" }).click();
    await expect(preview).toBeVisible();
    await expect(controls).toBeHidden();
    await expect(bar.getByRole("button", { name: "Preview" })).toHaveAttribute("aria-pressed", "true");

    await page.goto("/effects");
    await page.getByRole("link", { name: "Skip to code and exports" }).focus();
    await page.keyboard.press("Enter");
    await expect(output).toBeVisible();
    await expect(output).toBeFocused();
  });

  test("the open pane is announced and remembered for the studio after a reload", async ({ page }) => {
    await page.goto("/effects");
    const bar = page.getByRole("navigation", { name: "Studio panes" });
    await bar.getByRole("button", { name: "Output" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Output pane shown" })).toBeAttached();
    await expect(page.locator("#studio-output")).toBeVisible();

    await page.reload();
    await expect(page.locator("#studio-output")).toBeVisible();
    await expect(bar.getByRole("button", { name: "Output" })).toHaveAttribute("aria-pressed", "true");
    // Another studio keeps its own choice.
    await page.goto("/backgrounds");
    await expect(bar.getByRole("button", { name: "Controls" })).toHaveAttribute("aria-pressed", "true");
  });

  test("a desktop width has no bar and shows every pane", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/effects");
    await expect(page.getByRole("navigation", { name: "Studio panes" })).toBeHidden();
    await expect(page.locator("#studio-preview")).toBeVisible();
    await expect(page.locator("#studio-output")).toBeVisible();
  });
});
