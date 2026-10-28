import { describe, expect, test } from "vitest";

import { fontCategories, splitCatalog } from "../../scripts/font-catalog-parts.mjs";
import {
  fontCategories as categories,
  loadFontCatalog,
  loadFontCategory,
  loadFontIndex,
  loadFontMeta,
} from "@/lib/typography/catalog";

describe("the split font catalog", () => {
  test("the index and the details agree", async () => {
    const [index, full] = await Promise.all([loadFontIndex(), loadFontCatalog()]);
    expect(index.length).toBeGreaterThan(500);
    expect(full.map(({ family, category, rank }) => ({ family, category, rank }))).toEqual(index);
    expect(index.map((font) => font.rank)).toEqual(index.map((_, position) => position + 1));
  });

  test("every category file holds only its own category", async () => {
    for (const category of categories) {
      const fonts = await loadFontCategory(category);
      expect(fonts.length).toBeGreaterThan(0);
      expect(fonts.every((font) => font.category === category)).toBe(true);
    }
  });

  test("one family loads from its own category", async () => {
    const roboto = await loadFontMeta("Roboto");
    expect(roboto?.category).toBe("sans-serif");
    expect(roboto?.weights).toContain(400);
    expect(await loadFontMeta("No Such Font")).toBeUndefined();
  });

  test("the generator splits families the way the app reads them", async () => {
    const full = await loadFontCatalog();
    const { index, details } = splitCatalog(full);
    expect(fontCategories).toEqual([...categories]);
    expect(index).toHaveLength(full.length);
    expect(Object.values(details).flat()).toHaveLength(full.length);
  });
});
