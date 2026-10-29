import { expect, test } from "@playwright/test";

test("the social ZIP shows progress and can be cancelled, and then builds again", async ({ page }) => {
  await page.goto("/social");
  await expect(page.locator("h1").first()).toBeVisible();
  const downloads: string[] = [];
  page.on("download", (download) => downloads.push(download.suggestedFilename()));

  await page.getByRole("button", { name: /assets \(ZIP\)/ }).click();
  await expect(page.getByRole("button", { name: /^Rendering \d+%$/ })).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByText("Pack cancelled")).toBeVisible();
  await expect(page.getByRole("button", { name: /assets \(ZIP\)/ })).toBeEnabled();
  expect(downloads).toEqual([]);

  // The next one runs to the end.
  const download = page.waitForEvent("download", { timeout: 60_000 });
  await page.getByRole("button", { name: /assets \(ZIP\)/ }).click();
  expect((await download).suggestedFilename()).toMatch(/-social\.zip$/);
});
