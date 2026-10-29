import { expect, test, type Page } from "@playwright/test";

/** Waits until the saved Export Engine settings hold this format, so a reload cannot beat the write. */
async function saved(page: Page, id: string) {
  await expect
    .poll(() =>
      page.evaluate(
        (wanted) =>
          new Promise<boolean>((resolve) => {
            const open = indexedDB.open("designhub");
            open.onerror = () => resolve(false);
            open.onsuccess = () => {
              const request = open.result.transaction("kv").objectStore("kv").get("designhub:tokens");
              request.onsuccess = () =>
                resolve(String(request.result?.value ?? "").includes(`"openFormat":"${wanted}"`));
              request.onerror = () => resolve(false);
            };
          }),
        id,
      ),
    )
    .toBe(true);
}

test("a link opens a format, a reload keeps the one that was open, and an unknown id changes nothing", async ({
  page,
}) => {
  await page.goto("/export?format=tailwind-v4");
  await expect(page.getByRole("radio", { name: "Tailwind v4" }).first()).toHaveAttribute("aria-checked", "true");

  await saved(page, "tailwind-v4");
  // The choice survives a reload with no query.
  await page.goto("/export");
  await expect(page.getByRole("radio", { name: "Tailwind v4" }).first()).toHaveAttribute("aria-checked", "true");

  // Another format, picked by hand, is remembered instead.
  await page.getByRole("radio", { name: "CSS variables", exact: true }).first().click();
  await saved(page, "css");
  await page.goto("/export");
  await expect(page.getByRole("radio", { name: "CSS variables", exact: true }).first()).toHaveAttribute(
    "aria-checked",
    "true",
  );

  // An id that is not a format leaves the open one and shows no error.
  await page.goto("/export?format=nope");
  await expect(page.getByRole("radio", { name: "CSS variables", exact: true }).first()).toHaveAttribute(
    "aria-checked",
    "true",
  );
});
