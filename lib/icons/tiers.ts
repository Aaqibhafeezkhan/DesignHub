import type { ExportTier } from "@/types/export";

/**
 * Where each icon export sits in the picker, named like the token tiers in `lib/tokens/tiers.ts`. Core is
 * what most projects need: the SVG file, the React component and the inline HTML. Frameworks are the other
 * component formats. Platforms are the CSS data URI. PNG and ICO are binary downloads in the Raster panel,
 * not code in this picker, so they have no entry here. A format is listed by its id. Every format must be
 * here: a test fails otherwise, so a new format is a deliberate choice of tier.
 *
 * Icon ids are their own table because they overlap the token ids with another meaning: `react` here is a
 * component in Core, and `react` in the token tiers is a theme in Frameworks.
 */
const TIERS: Record<string, ExportTier> = {
  // Core
  svg: "core",
  react: "core",
  html: "core",
  "html-decorative": "core",
  // Frameworks
  vue: "frameworks",
  svelte: "frameworks",
  angular: "frameworks",
  solid: "frameworks",
  qwik: "frameworks",
  lit: "frameworks",
  astro: "frameworks",
  preact: "frameworks",
  native: "frameworks",
  // Platforms
  css: "platforms",
};

/** The tier of an icon export by id. */
export function iconTierOf(id: string): ExportTier | undefined {
  return TIERS[id];
}

/** Ids the table names, for tests that check they are real formats. */
export const iconTierIds = Object.keys(TIERS);
