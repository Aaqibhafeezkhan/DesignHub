import { expect, test } from "@playwright/test";

test("the home page asks what to make, links each goal, and keeps every studio one click away", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "What do you want to make?" })).toBeVisible();

  const goals = page.getByRole("region", { name: "What do you want to make?" }).getByRole("link");
  expect(await goals.count()).toBe(8);
  for (const href of await goals.evaluateAll((links) => links.map((link) => link.getAttribute("href")))) {
    const response = await page.request.get(href!);
    expect(response.status(), href!).toBe(200);
  }

  // The full list is folded, and opens with the keyboard.
  const all = page.locator("summary", { hasText: /All \d+ studios/ });
  await expect(page.getByRole("link", { name: /Export Engine/ }).first()).toBeAttached();
  await all.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("details[open]")).toHaveCount(1);
  await page
    .getByRole("link", { name: /Accessibility Lab/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/accessibility$/);
});
