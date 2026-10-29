import { expect, test } from "@playwright/test";

test("holding a slider key in the Accessibility Lab keeps the control current and the report catches up", async ({
  page,
}) => {
  await page.goto("/accessibility");
  await expect(page.locator("h1").first()).toBeVisible();
  await page.getByRole("tab", { name: "Reading" }).click();
  const slider = page.getByRole("slider").first();
  await expect(slider).toBeVisible();
  const start = Number(await slider.getAttribute("aria-valuenow"));

  await page.evaluate(() => {
    const longTasks: number[] = [];
    Object.assign(window, { longTasks });
    new PerformanceObserver((entries) =>
      entries.getEntries().forEach((entry) => longTasks.push(entry.duration)),
    ).observe({
      type: "longtask",
    });
  });
  await slider.focus();
  // The range is short, so go up and down: 48 key presses in all, each one a new setting for the report.
  for (let round = 0; round < 6; round += 1) {
    for (let step = 0; step < 4; step += 1) await page.keyboard.press("ArrowRight");
    await expect(slider).toHaveAttribute("aria-valuenow", String(start + 4));
    for (let step = 0; step < 4; step += 1) await page.keyboard.press("ArrowLeft");
    await expect(slider).toHaveAttribute("aria-valuenow", String(start));
  }
  const longest = await page.evaluate(() => Math.max(0, ...(window as unknown as { longTasks: number[] }).longTasks));
  expect(longest).toBeLessThan(150);
});
