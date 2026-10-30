import { expect, test } from "@playwright/test";

test("sidebar groups fold with the keyboard, remember it, and the current studio's group stays open", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto("/colors");
  const nav = page.getByRole("navigation", { name: "Studios" });
  const tools = nav.getByRole("button", { name: "Tools" });
  await expect(tools).toHaveAttribute("aria-expanded", "true");
  await expect(nav.getByRole("link", { name: "Export Engine" })).toBeVisible();

  // Fold with the keyboard.
  await tools.focus();
  await page.keyboard.press("Enter");
  await expect(tools).toHaveAttribute("aria-expanded", "false");
  await expect(nav.getByRole("link", { name: "Export Engine" })).toBeHidden();

  // It is remembered after a reload.
  await page.reload();
  await expect(nav.getByRole("button", { name: "Tools" })).toHaveAttribute("aria-expanded", "false");

  // The group of the current studio stays open, whatever was saved.
  await page.goto("/export");
  await expect(nav.getByRole("button", { name: "Tools" })).toHaveAttribute("aria-expanded", "true");
  await expect(nav.getByRole("link", { name: "Export Engine" })).toBeVisible();

  // The shortcuts still reach every studio, folded or not.
  await page.goto("/colors");
  await page.getByRole("navigation", { name: "Studios" }).getByRole("button", { name: "Tools" }).waitFor();
  await page.keyboard.press("g");
  await page.keyboard.press("e");
  await expect(page).toHaveURL(/\/export$/);
});

test("the sidebar collapses to icons, keeps every studio reachable by name, and remembers it", async ({ page }) => {
  await page.goto("/colors");
  const nav = page.getByRole("navigation", { name: "Studios" });
  const wide = await nav.evaluate((node) => node.getBoundingClientRect().width);
  expect(wide).toBeGreaterThan(200);

  await nav.getByRole("button", { name: "Collapse sidebar" }).click();
  await expect(nav.getByRole("button", { name: "Expand sidebar" })).toHaveAttribute("aria-pressed", "true");
  expect(await nav.evaluate((node) => node.getBoundingClientRect().width)).toBeLessThan(80);
  // No text is drawn, but every studio is a link with its name, and the current one is marked.
  await expect(nav.getByRole("link", { name: "Typography" })).toBeVisible();
  await expect(nav.getByRole("link", { name: /^Color/ })).toHaveAttribute("aria-current", "page");
  await nav.getByRole("link", { name: "Typography" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/typography$/);

  // It survives a reload, and the shortcut opens it again.
  await page.reload();
  expect(await nav.evaluate((node) => node.getBoundingClientRect().width)).toBeLessThan(80);
  await page.keyboard.press("ControlOrMeta+b");
  await expect(nav.getByRole("button", { name: "Collapse sidebar" })).toBeVisible();
  expect(await nav.evaluate((node) => node.getBoundingClientRect().width)).toBeGreaterThan(200);
});
