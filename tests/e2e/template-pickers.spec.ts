import { expect, test } from "@playwright/test";

test("the mockup picker has four groups and a search, and the bracket keys cycle through what is shown", async ({
  page,
}) => {
  await page.goto("/mockups");
  await expect(page.locator("h1").first()).toBeVisible();
  const picker = page.getByRole("group", { name: "Mockup template" });
  for (const name of ["Print", "Objects", "Devices", "Screens"]) {
    await expect(picker.getByRole("button", { name: new RegExp(`^${name}`) })).toBeVisible();
  }
  expect(await picker.getByRole("radio").count()).toBeLessThanOrEqual(8);

  // A search across groups, then the bracket keys stay inside the matches.
  const search = page.getByRole("searchbox", { name: "Find a mockup" });
  await search.fill("business card");
  await expect(picker.getByRole("radio")).toHaveCount(1);
  await picker.getByRole("radio", { name: "Business card" }).click();
  await search.fill("van");
  await expect(picker.getByRole("radio", { name: "Delivery van" })).toBeVisible();
  await search.blur();
  await page.keyboard.press("]");
  await expect(picker.getByRole("radio", { name: "Delivery van" })).toHaveAttribute("aria-checked", "true");

  await search.fill("zzzz");
  await expect(page.getByText("No mockup matches that search.")).toBeVisible();
});

test("the social picker finds a template by name or size and opens the folded platforms", async ({ page }) => {
  await page.goto("/social");
  await expect(page.locator("h1").first()).toBeVisible();
  const search = page.getByRole("searchbox", { name: "Find a template" });

  await search.fill("kick");
  // Kick is under "More platforms": a search opens it.
  await expect(page.getByRole("radio", { name: /Channel banner|Banner/ }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /More platforms/ })).toHaveAttribute("aria-expanded", "true");

  await search.fill("1080x1920");
  await expect(page.getByRole("radio", { name: /Story/ }).first()).toBeVisible();

  await search.fill("zzzz");
  await expect(page.getByText("No template matches that search.")).toBeVisible();
});
