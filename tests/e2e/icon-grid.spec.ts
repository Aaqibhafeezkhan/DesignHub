import { expect, test } from "@playwright/test";

const TOTAL = 600;
const ids = Array.from({ length: TOTAL }, (_, index) => `mdi:glyph-${index}`);

test("a search with hundreds of results keeps about a screenful of icons in the page, and Tab walks them all", async ({
  page,
}) => {
  const fetched = new Set<string>();
  await page.route("https://api.iconify.design/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/search") {
      return route.fulfill({ json: { icons: ids, total: TOTAL } });
    }
    if (url.pathname.endsWith(".json")) {
      const names = (url.searchParams.get("icons") ?? "").split(",");
      names.forEach((name) => fetched.add(name));
      return route.fulfill({
        json: {
          prefix: "mdi",
          width: 24,
          height: 24,
          icons: Object.fromEntries(names.map((name) => [name, { body: '<path d="M2 2h20v20H2z"/>' }])),
        },
      });
    }
    return route.fulfill({ json: {} });
  });

  await page.goto("/icons");
  await page.getByLabel("Search icons").fill("glyph");
  const grid = page.getByRole("list", { name: "Icons" }).last();
  // Wait for the search results (the featured icons show first): every tile knows the size of the whole list.
  await expect(grid.locator(`li[aria-setsize="${TOTAL}"]`).first()).toBeVisible();

  // Only the rows near the view exist, and only their bodies were asked for.
  expect(await grid.getByRole("button").count()).toBeLessThanOrEqual(120);
  await expect.poll(() => fetched.size).toBeGreaterThan(0);
  expect(fetched.size).toBeLessThan(TOTAL / 2);

  // Scrolling to the end draws the last icons and keeps the count small.
  await grid.evaluate((list) => list.parentElement?.scrollIntoView({ block: "end", behavior: "instant" }));
  await expect(grid.getByRole("button", { name: `mdi:glyph-${TOTAL - 1}` })).toBeVisible();
  expect(await grid.getByRole("button").count()).toBeLessThanOrEqual(120);

  // The grid is one tab stop, and the arrow keys move through every icon, drawing each one before focusing it.
  await grid.evaluate((list) => list.parentElement?.scrollIntoView({ block: "start", behavior: "instant" }));
  const first = grid.getByRole("button").first();
  await expect(first).toHaveAttribute("data-index", "0");
  expect(await grid.locator('button[tabindex="0"]').count()).toBe(1);
  await first.focus();
  const focusedIndex = () =>
    page.evaluate(() => Number((document.activeElement as HTMLElement | null)?.getAttribute("data-index") ?? -1));

  await page.keyboard.press("ArrowRight");
  expect(await focusedIndex()).toBe(1);
  await page.keyboard.press("ArrowLeft");
  expect(await focusedIndex()).toBe(0);
  await page.keyboard.press("ArrowDown");
  const columns = await focusedIndex();
  expect(columns).toBeGreaterThan(1);
  await page.keyboard.press("ArrowUp");
  expect(await focusedIndex()).toBe(0);
  // A move past the start stops there.
  await page.keyboard.press("ArrowLeft");
  expect(await focusedIndex()).toBe(0);

  await page.keyboard.press("PageDown");
  expect(await focusedIndex()).toBeGreaterThan(columns);
  await page.keyboard.press("End");
  expect(await focusedIndex()).toBe(TOTAL - 1);
  await expect(grid.getByRole("button", { name: `mdi:glyph-${TOTAL - 1}` })).toBeFocused();
  expect(await grid.getByRole("button").count()).toBeLessThanOrEqual(120);
  await page.keyboard.press("Home");
  expect(await focusedIndex()).toBe(0);

  // Tab leaves the grid after one stop.
  await page.keyboard.press("Tab");
  const inGrid = await page.evaluate(() => Boolean(document.activeElement?.closest('ul[aria-label="Icons"]')));
  expect(inGrid).toBe(false);
});
