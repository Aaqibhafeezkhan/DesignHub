import { expect, test } from "@playwright/test";

test("a link opens a format, a reload keeps the one that was open, and an unknown id changes nothing", async ({
  page,
}) => {
  await page.goto("/export?format=tailwind-v4");
  await expect(page.getByRole("radio", { name: "Tailwind v4" }).first()).toHaveAttribute("aria-checked", "true");

  // The choice survives a reload with no query.
  await page.goto("/export");
  await expect(page.getByRole("radio", { name: "Tailwind v4" }).first()).toHaveAttribute("aria-checked", "true");

  // Another format, picked by hand, is remembered instead.
  await page.getByRole("radio", { name: "CSS variables", exact: true }).first().click();
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
