import { expect, test } from "@playwright/test";

test.describe("the palette toolbar keeps three actions in view and the rest in a More menu", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("at phone width, four controls show and every other action is in the menu", async ({ page }) => {
    await page.goto("/colors");
    const toolbar = page.getByRole("toolbar", { name: "Palette actions" });
    await expect(toolbar).toBeVisible();
    await expect(toolbar.getByRole("button")).toHaveCount(4);

    await toolbar.getByRole("button", { name: "More" }).click();
    for (const name of ["Add color", "Import", "Save"]) {
      await expect(page.getByRole("button", { name, exact: true })).toBeVisible();
    }

    // Save works from the menu and the menu closes.
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("Palette saved")).toBeVisible();
    await expect(page.getByRole("button", { name: "Save", exact: true })).toBeHidden();
  });

  test("the import dialog opens from the menu and gives focus back to the More button", async ({ page }) => {
    await page.goto("/colors");
    const more = page.getByRole("toolbar", { name: "Palette actions" }).getByRole("button", { name: "More" });
    await more.click();
    await page.getByRole("button", { name: "Import", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Import palette" });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(more).toBeFocused();
  });

  test("the menu opens and closes with the keyboard", async ({ page }) => {
    await page.goto("/colors");
    const more = page.getByRole("toolbar", { name: "Palette actions" }).getByRole("button", { name: "More" });
    await more.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: "Save", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Save", exact: true })).toBeHidden();
    await expect(more).toBeFocused();
  });
});
