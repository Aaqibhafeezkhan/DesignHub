import { expect, test } from "@playwright/test";

test("palette changes are announced to screen readers", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/colors");
  await expect(page.locator("html")).toHaveClass(/dark/);

  const status = page.locator('[role="status"][aria-live="polite"]');
  if ((await status.count()) === 0) throw new Error("palette announcement live region missing");

  await page
    .getByRole("button", { name: /^Lock / })
    .first()
    .click();
  await page.getByRole("button", { name: "Generate Space", exact: true }).click();
  await expect(status).toContainText("New palette:");
  await expect(status).toContainText("1 locked swatch kept.");

  await status.evaluate((element) => {
    let changes = 0;
    new MutationObserver(() => {
      changes += 1;
      element.setAttribute("data-announcement-mutations", String(changes));
    }).observe(element, { childList: true, characterData: true, subtree: true });
  });
  const mutationsBeforeSpace = Number(await status.getAttribute("data-announcement-mutations"));
  await page.locator("body").click({ position: { x: 4, y: 4 } });
  await page.keyboard.press("Space");
  await expect
    .poll(async () => Number(await status.getAttribute("data-announcement-mutations")))
    .toBeGreaterThan(mutationsBeforeSpace);
  await expect(status).toContainText("New palette:");
  await expect(status).toContainText("1 locked swatch kept.");

  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.locator("html")).toHaveClass(/light/);
  await page.getByRole("button", { name: "Load palette Indigo launch" }).click();
  await expect(status).toContainText("Loaded palette:");
});
