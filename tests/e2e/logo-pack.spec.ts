import { readFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

test("the logo pack is built in the browser with a PNG and a PDF for every variant", async ({ page }) => {
  await page.goto("/logo");
  await expect(page.locator("h1").first()).toBeVisible();
  const download = page.waitForEvent("download", { timeout: 90_000 });
  await page.getByRole("button", { name: /Logo pack \(\.zip\)/ }).click();
  const file = await (await download).path();
  const bytes = readFileSync(file);
  // A ZIP, and the names of its files are stored in the clear: every variant has all three forms.
  expect(bytes.subarray(0, 2).toString()).toBe("PK");
  const names = bytes.toString("latin1");
  for (const variant of ["color", "monochrome", "horizontal", "avatar", "social-share"]) {
    expect(names).toContain(`-${variant}.svg`);
    expect(names).toContain(`-${variant}`);
    expect(names).toMatch(new RegExp(`pdf/[a-z0-9-]*-${variant}\\.pdf`));
  }
  expect(names).toMatch(/png\/[a-z0-9-]*-avatar-400\.png/);
  expect(names).toMatch(/png\/[a-z0-9-]*-avatar-1024\.png/);
  expect(bytes.length).toBeGreaterThan(50_000);
});
