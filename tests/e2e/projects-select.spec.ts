import { expect, test, type Page } from "@playwright/test";

async function create(page: Page, name: string) {
  await page.getByRole("button", { name: "New project" }).first().click();
  const dialog = page.getByRole("dialog", { name: "New brand project" });
  await dialog.getByLabel("Brand name").fill(name);
  await dialog.getByRole("button", { name: "Create and open" }).click();
  await page.goto("/projects");
  await expect(page.getByRole("heading", { name, level: 2 })).toBeVisible();
}

test("select several projects, tag them, export them, and delete them with one undo, keeping the open one", async ({
  page,
}) => {
  await page.goto("/projects");
  await expect(page.getByRole("heading", { name: "Acme", level: 2 })).toBeVisible();
  await create(page, "Selected One");
  await create(page, "Open One");

  // Which project is open is whatever the page says; the others are what a bulk delete may remove.
  const openButton = page.getByRole("button", { name: /\(open\)$/ });
  const openName = ((await openButton.getAttribute("aria-label")) ?? (await openButton.innerText())).replace(
    / \(open\)$/,
    "",
  );
  const others = ["Acme", "Selected One", "Open One"].filter((name) => name !== openName);
  expect(others).toHaveLength(2);

  // Nothing changes until Select is pressed: no checkboxes.
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await page.getByRole("button", { name: "Select", exact: true }).click();
  const bar = page.getByRole("region", { name: "Actions for the selected projects" });
  await expect(bar).toContainText("0 projects selected");

  for (const name of others) await page.getByRole("checkbox", { name: `Select ${name}` }).check();
  await expect(bar).toContainText("2 projects selected");

  // Tag both.
  await bar.getByLabel("Tag to add").fill("batch");
  await bar.getByRole("button", { name: "Add tag" }).click();
  await expect(page.getByText("Tagged 2 projects")).toBeVisible();
  for (const name of others) {
    await expect(page.getByRole("button", { name: `Remove tag batch from ${name}` })).toBeVisible();
  }

  // Export them as one ZIP.
  const download = page.waitForEvent("download");
  await bar.getByRole("button", { name: "Export ZIP" }).click();
  expect((await download).suggestedFilename()).toMatch(/^designhub-projects-.*\.zip$/);

  // Select all shown, then delete: the open project stays, the others go, and one Undo brings them back.
  await bar.getByRole("button", { name: "Select all shown" }).click();
  await bar.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Deleted 2 projects")).toBeVisible();
  await expect(page.getByText("The open project was kept.").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: openName, level: 2 })).toBeVisible();
  for (const name of others) await expect(page.getByRole("heading", { name, level: 2 })).toHaveCount(0);

  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByText("Restored 2 projects")).toBeVisible();
  for (const name of others) await expect(page.getByRole("heading", { name, level: 2 })).toBeVisible();

  await bar.getByRole("button", { name: "Done" }).click();
  await expect(page.getByRole("checkbox")).toHaveCount(0);
});
