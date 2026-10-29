import { expect, test } from "@playwright/test";

test("the storage panel shows sizes, and clearing the offline cache keeps the projects", async ({ page }) => {
  // Let the service worker install so there is an offline cache to clear.
  await page.goto("/colors");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(async () => (await caches.keys()).some((name) => name.startsWith("designhub-static-"))))
    .toBe(true);

  await page.goto("/projects");
  await expect(page.locator("h1").first()).toBeVisible();
  await page.getByRole("button", { name: "Storage", exact: true }).click();
  await page.getByRole("button", { name: "Check storage" }).click();
  const status = page.getByRole("status").filter({ hasText: "Offline cache" });
  await expect(status).toContainText("Projects");
  await expect(status).toContainText("Version history");
  await expect(status).not.toContainText("None yet");
  const projects = (await status.locator("dd").first().innerText()).split(" · ")[0];

  await page.getByRole("button", { name: "Clear the offline cache" }).click();
  await expect(status).toContainText("None yet");
  // The share cache and the projects are untouched: the same number of projects is still counted.
  expect((await status.locator("dd").first().innerText()).split(" · ")[0]).toBe(projects);
  await expect(page.getByRole("button", { name: "Clear the offline cache" })).toHaveCount(0);
});
