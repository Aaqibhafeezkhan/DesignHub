import { expect, test } from "@playwright/test";

test("the generator picker is grouped, searchable, and finds a merged look by its old name", async ({ page }) => {
  await page.goto("/backgrounds");
  await expect(page.locator("h1").first()).toBeVisible();
  const picker = page.getByRole("group", { name: "Generator" });

  // The group of the selected generator is open: a handful of buttons, not all 33.
  expect(await picker.getByRole("radio").count()).toBeLessThanOrEqual(9);

  // Open another group and pick from it.
  await picker.getByRole("button", { name: /^Textures/ }).click();
  await picker.getByRole("radio", { name: "Noise" }).click();
  await expect(picker.getByRole("radio", { name: "Noise" })).toHaveAttribute("aria-checked", "true");

  // A search for an old name finds the merged generator that now holds that look.
  const search = page.getByRole("searchbox", { name: "Find a generator" });
  await search.fill("plaid");
  await expect(picker.getByRole("radio", { name: "Woven" })).toBeVisible();
  await picker.getByRole("radio", { name: "Woven" }).click();
  await expect(page.getByRole("radiogroup", { name: "Woven look" })).toBeVisible();

  await search.fill("zzzz");
  await expect(page.getByText("No generator matches that search.")).toBeVisible();
});
