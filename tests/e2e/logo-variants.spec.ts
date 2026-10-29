import { expect, test } from "@playwright/test";

test("the logo variants are in sets, searchable, and a set holding the selection stays open", async ({ page }) => {
  await page.goto("/logo");
  await page.getByRole("tab", { name: "Variants" }).click();
  const group = page.getByRole("group", { name: "Logo variants" });
  await expect(group).toBeVisible();

  // Two sets are open at first: a handful of cards, not all eleven.
  expect(await group.locator("li").count()).toBeLessThanOrEqual(8);
  await expect(group.getByRole("button", { name: /^Marks and avatars/ })).toHaveAttribute("aria-expanded", "false");

  // Open a folded set and pick from it: the set then stays open.
  await group.getByRole("button", { name: /^Marks and avatars/ }).click();
  await group.getByRole("button", { name: /Monogram/ }).click();
  await expect(group.getByRole("button", { name: /Monogram/ })).toHaveAttribute("aria-pressed", "true");
  await group.getByRole("button", { name: /^Marks and avatars/ }).click();
  await expect(group.getByRole("button", { name: /^Marks and avatars/ })).toHaveAttribute("aria-expanded", "true");

  // A search opens the sets that match, whatever was folded.
  await group.getByRole("searchbox", { name: "Find a variant" }).fill("inverted");
  await expect(group.getByRole("button", { name: /Inverted/ })).toBeVisible();
  await expect(group.locator("li")).toHaveCount(1);
  await group.getByRole("searchbox", { name: "Find a variant" }).fill("zzzz");
  await expect(page.getByText("No variant matches that search.")).toBeVisible();
});
