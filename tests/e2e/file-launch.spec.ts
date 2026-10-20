import { expect, test, type Page } from "@playwright/test";

import { defaultSnapshot } from "@/lib/projects/snapshot";
import { projectToJson } from "@/lib/projects/transfer";

const project = (name: string) =>
  projectToJson({
    id: "p1",
    favorite: false,
    tags: [],
    createdAt: 1,
    updatedAt: 1,
    lastOpenedAt: 1,
    snapshot: defaultSnapshot(name),
  });

/** Stands in for the browser's file handler: launches the app with one file, as a double click would. */
async function launchWith(page: Page, name: string, text: string) {
  await page.addInitScript(
    ([fileName, content]) => {
      Object.defineProperty(window, "launchQueue", {
        value: {
          setConsumer(consumer: (params: { files: unknown[] }) => void) {
            const file = new File([content!], fileName!, { type: "application/json" });
            setTimeout(() => consumer({ files: [{ name: fileName, getFile: async () => file }] }), 0);
          },
        },
      });
    },
    [name, text],
  );
}

test("a launched project file asks before importing and then adds it as a new project", async ({ page }) => {
  await launchWith(page, "acme.designhub.json", project("Launch Test Brand"));
  await page.goto("/projects");

  const dialog = page.getByRole("dialog", { name: "Import Launch Test Brand?" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("acme.designhub.json");
  await dialog.getByRole("button", { name: "Import", exact: true }).click();
  await expect(page.getByText("Imported Launch Test Brand")).toBeVisible();
});

test("cancelling a launched file imports nothing", async ({ page }) => {
  await launchWith(page, "acme.designhub.json", project("Cancelled Brand"));
  await page.goto("/projects");
  const dialog = page.getByRole("dialog", { name: "Import Cancelled Brand?" });
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText("Cancelled Brand")).toHaveCount(0);
});

test("an invalid launched file shows a clear message and no prompt", async ({ page }) => {
  await launchWith(page, "broken.designhub.json", "{ not json");
  await page.goto("/projects");
  await expect(page.getByText("isn't valid JSON")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
