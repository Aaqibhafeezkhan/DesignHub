import { describe, expect, test } from "vitest";

import { iconExports } from "@/lib/icons/export";
import { defaultIconStyle } from "@/lib/icons/svg";
import { iconTierIds, iconTierOf } from "@/lib/icons/tiers";
import { exportTiers } from "@/lib/tokens/tiers";

const icon = {
  body: '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M4 12h16"/>',
  width: 24,
  height: 24,
};

const formats = iconExports("tabler:brand-github", icon, defaultIconStyle);
const tierIds = (tier: string) => formats.filter((format) => format.tier === tier).map((format) => format.id);

describe("icon export tiers", () => {
  test("every format has a tier", () => {
    const missing = formats.filter((format) => !format.tier).map((format) => format.id);
    expect(missing).toEqual([]);
    for (const format of formats) expect(exportTiers, format.id).toContain(format.tier);
  });

  test("every tier has formats", () => {
    for (const tier of exportTiers) expect(tierIds(tier).length, tier).toBeGreaterThan(0);
  });

  test("the tier table names only real formats, so a removed format does not leave an entry behind", () => {
    const real = new Set(formats.map((format) => format.id));
    for (const id of iconTierIds) expect(real.has(id), id).toBe(true);
  });

  test("core holds the SVG file, the React component and the HTML", () => {
    expect(tierIds("core")).toEqual(["svg", "react", "html", "html-decorative"]);
  });

  test("the other component formats are frameworks and the CSS data URI is a platform", () => {
    expect(tierIds("frameworks").sort()).toEqual(
      ["angular", "astro", "lit", "native", "preact", "qwik", "solid", "svelte", "vue"].sort(),
    );
    expect(tierIds("platforms")).toEqual(["css"]);
  });

  test("a format id that is not in the table has no tier", () => {
    expect(iconTierOf("not-a-format")).toBeUndefined();
  });

  test("tiering does not change the ids, their order or the file names", () => {
    expect(formats.map((format) => format.id)).toEqual([
      "svg",
      "react",
      "vue",
      "svelte",
      "solid",
      "preact",
      "qwik",
      "native",
      "angular",
      "lit",
      "astro",
      "html",
      "html-decorative",
      "css",
    ]);
    expect(formats.map((format) => format.filename)).toEqual([
      "brand-github.svg",
      "BrandGithubIcon.tsx",
      "BrandGithubIcon.vue",
      "BrandGithubIcon.svelte",
      "BrandGithubIcon.tsx",
      "BrandGithubIcon.tsx",
      "BrandGithubIcon.tsx",
      "BrandGithubIcon.native.tsx",
      "brand-github-icon.component.ts",
      "brand-github-icon.ts",
      "BrandGithubIcon.astro",
      "brand-github.html",
      "brand-github.decorative.html",
      "brand-github.css",
    ]);
  });
});
