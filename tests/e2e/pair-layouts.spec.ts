import { expect, test } from "@playwright/test";

test("every pair layout fits a 320 px screen and keeps the chosen pair", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/typography");
  await page.getByRole("tab", { name: /pair/i }).click();
  const pairBefore = await page.getByRole("combobox", { name: /^Heading font/ }).textContent();

  const group = page.getByRole("radiogroup", { name: "Layout" });
  const layouts = [
    ["Pricing card", "pricing"],
    ["Landing hero", "hero"],
    ["Blog article", "article"],
  ] as const;
  for (const [name, id] of layouts) {
    await group.getByRole("radio", { name }).click();
    const frame = page.locator(`[data-pair-layout="${id}"]`);
    await expect(frame).toBeVisible();
    // The frame never scrolls sideways and never extends past the 320 px screen.
    const { scroll, client, right } = await frame.evaluate((element) => ({
      scroll: element.scrollWidth,
      client: element.clientWidth,
      right: element.getBoundingClientRect().right,
    }));
    expect(scroll, name).toBeLessThanOrEqual(client);
    expect(right, name).toBeLessThanOrEqual(320);
  }
  await expect(page.getByRole("combobox", { name: /^Heading font/ })).toHaveText(pairBefore ?? "");
});
