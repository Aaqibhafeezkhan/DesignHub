import { expect, test } from "@playwright/test";

test("the effect picker is grouped, searchable and keyboard friendly", async ({ page }) => {
  await page.goto("/effects");
  await expect(page.locator("h1").first()).toBeVisible();
  const picker = page.getByRole("group", { name: "Effect" });

  // Only the group of the selected effect is open: a handful of buttons, not all 21.
  expect(await picker.getByRole("radio").count()).toBeLessThanOrEqual(8);
  await expect(picker.getByRole("button", { name: /^Surfaces/ })).toHaveAttribute("aria-expanded", "true");
  await expect(picker.getByRole("button", { name: /^Motion/ })).toHaveAttribute("aria-expanded", "false");

  // Open another group with the keyboard and pick from it.
  await picker.getByRole("button", { name: /^Motion/ }).focus();
  await page.keyboard.press("Enter");
  await picker.getByRole("radio", { name: "Card tilt" }).click();
  await expect(picker.getByRole("radio", { name: "Card tilt" })).toHaveAttribute("aria-checked", "true");

  // A search finds an effect in a folded group and opens it.
  await page.getByRole("searchbox", { name: "Find an effect" }).fill("scrim");
  await expect(picker.getByRole("radio")).toHaveCount(1);
  await picker.getByRole("radio", { name: "Scrim" }).click();
  await expect(page.getByRole("heading", { name: "Controls" })).toBeVisible();

  // A search with no match says so.
  await page.getByRole("searchbox", { name: "Find an effect" }).fill("zzzz");
  await expect(page.getByText("No effect matches that search.")).toBeVisible();
});
