import type { FontCategory, FontFamily } from "@/types/typography";

const categories: readonly FontCategory[] = ["sans-serif", "serif", "display", "handwriting", "monospace"];

function isFontFamily(value: unknown): value is FontFamily {
  if (typeof value !== "object" || value === null) return false;
  const font = value as Record<string, unknown>;
  return (
    typeof font.family === "string" &&
    typeof font.category === "string" &&
    categories.includes(font.category as FontCategory) &&
    Array.isArray(font.weights)
  );
}

/** What the pickers and the token hooks need to know about a family. The weights and axes come with the details. */
export type FontSummary = Pick<FontFamily, "family" | "category" | "rank"> &
  Partial<Pick<FontFamily, "weights" | "axes">>;

/** The details of one category, as separate chunks so a page loads only the categories it shows. */
const detailLoaders: Record<FontCategory, () => Promise<{ default: unknown }>> = {
  "sans-serif": () => import("./catalog/sans-serif.json"),
  serif: () => import("./catalog/serif.json"),
  display: () => import("./catalog/display.json"),
  handwriting: () => import("./catalog/handwriting.json"),
  monospace: () => import("./catalog/monospace.json"),
};

let indexCache: Promise<FontSummary[]> | null = null;
const detailCache = new Map<FontCategory, Promise<FontFamily[]>>();

/** The index: every family with its category and rank, in popularity order (~7 KB gzipped). */
export function loadFontIndex(): Promise<FontSummary[]> {
  indexCache ??= import("./catalog-index.json").then((module) => {
    const rows: unknown = module.default;
    if (!Array.isArray(rows)) return [];
    return rows.flatMap((row, position): FontSummary[] => {
      const [family, category] = Array.isArray(row) ? row : [];
      const known = typeof category === "number" ? categories[category] : undefined;
      return typeof family === "string" && known ? [{ family, category: known, rank: position + 1 }] : [];
    });
  });
  return indexCache;
}

/** The full details of one category, fetched the first time it is asked for. */
export function loadFontCategory(category: FontCategory): Promise<FontFamily[]> {
  let loaded = detailCache.get(category);
  if (!loaded) {
    loaded = detailLoaders[category]().then((module) => {
      const data: unknown = module.default;
      return Array.isArray(data) ? data.filter(isFontFamily) : [];
    });
    detailCache.set(category, loaded);
  }
  return loaded;
}

/** The details of one family: only the part of the catalog that holds it is fetched. */
export async function loadFontMeta(family: string): Promise<FontFamily | undefined> {
  const entry = (await loadFontIndex()).find((font) => font.family === family);
  if (!entry) return undefined;
  return (await loadFontCategory(entry.category)).find((font) => font.family === family);
}

/** Every family with its details, in popularity order. For browsing, the command line and the tests. */
export async function loadFontCatalog(): Promise<FontFamily[]> {
  const parts = await Promise.all(categories.map(loadFontCategory));
  return parts.flat().sort((a, b) => a.rank - b.rank);
}

export function isVariableFont(font: Pick<FontSummary, "axes">): boolean {
  return Boolean(font.axes?.length);
}

export const fontCategoryLabels: Record<FontCategory, string> = {
  "sans-serif": "Sans serif",
  serif: "Serif",
  display: "Display",
  handwriting: "Handwriting",
  monospace: "Monospace",
};

export { categories as fontCategories };
