import { expect, test } from "@playwright/test";

test("the provider is one line until it is changed, and a choice folds the list again", async ({ page }) => {
  await page.goto("/brand-dna");
  await expect(page.locator("h1").first()).toBeVisible();

  // The default provider runs on the device, and the line says where images go.
  await expect(page.getByRole("radiogroup", { name: "Analysis provider" })).toHaveCount(0);
  await expect(page.getByText("Your images stay on this device.")).toBeVisible();

  await page.getByRole("button", { name: "Change provider" }).click();
  const list = page.getByRole("radiogroup", { name: "Analysis provider" });
  await expect(list).toBeVisible();
  await list.getByRole("radio", { name: /AI \(your key\)/ }).click();
  await expect(list).toHaveCount(0);
  // An AI provider says it sends something, and its key panel stays in view.
  await expect(page.getByText(/Choose what is sent, and where, below/)).toBeVisible();
});
