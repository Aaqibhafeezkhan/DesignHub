import { expect, test } from "@playwright/test";

test("a first visit prefetches no other studio until its link is hovered or focused", async ({ page }) => {
  const prefetched: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.searchParams.has("_rsc") && url.pathname !== "/") prefetched.push(url.pathname);
  });

  await page.goto("/");
  await expect(page.locator("h1").first()).toBeVisible();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);
  expect(prefetched).toEqual([]);

  // The pointer arriving starts the prefetch of that studio, and only that one.
  const link = page.locator('a[href="/typography"]').first();
  await link.scrollIntoViewIfNeeded();
  await link.hover();
  await expect.poll(() => prefetched).toContain("/typography");
  expect(new Set(prefetched)).toEqual(new Set(["/typography"]));

  // Keyboard focus does too.
  await page.locator('a[href="/colors"]').first().focus();
  await expect.poll(() => prefetched).toContain("/colors");

  // And a click still navigates inside the app, without a full page load.
  await page.evaluate(() => Object.assign(window, { stayed: true }));
  await link.click();
  await expect(page).toHaveURL(/\/typography$/);
  expect(await page.evaluate(() => (window as unknown as { stayed?: boolean }).stayed)).toBe(true);
});
