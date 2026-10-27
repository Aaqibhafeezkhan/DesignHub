import { isVariableFont, type FontSummary } from "@/lib/typography/catalog";
import type { FontCategory } from "@/types/typography";

export type FontSort = "popular" | "alphabetical" | "weights";

export type FontFilters = {
  query: string;
  category: FontCategory | "all";
  variableOnly: boolean;
  favoritesOnly: boolean;
  sort: FontSort;
};

export const defaultFontFilters: FontFilters = {
  query: "",
  category: "all",
  variableOnly: false,
  favoritesOnly: false,
  sort: "popular",
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Works on the index as well as on the full catalog; the variable and weight filters need the details. */
export function filterFonts<T extends FontSummary>(fonts: T[], filters: FontFilters, favorites: string[]): T[] {
  const query = normalize(filters.query);
  const favoriteSet = new Set(favorites);

  const result = fonts.filter((font) => {
    if (filters.category !== "all" && font.category !== filters.category) return false;
    if (filters.variableOnly && !isVariableFont(font)) return false;
    if (filters.favoritesOnly && !favoriteSet.has(font.family)) return false;
    if (query && !normalize(font.family).includes(query)) return false;
    return true;
  });

  switch (filters.sort) {
    case "alphabetical":
      return result.sort((a, b) => a.family.localeCompare(b.family));
    case "weights":
      return result.sort((a, b) => (b.weights?.length ?? 0) - (a.weights?.length ?? 0) || a.rank - b.rank);
    case "popular":
      // Exact-prefix matches first so "Inter" beats "Interstate".
      return query
        ? result.sort((a, b) => {
            const aPrefix = normalize(a.family).startsWith(query) ? 0 : 1;
            const bPrefix = normalize(b.family).startsWith(query) ? 0 : 1;
            return aPrefix - bPrefix || a.rank - b.rank;
          })
        : result.sort((a, b) => a.rank - b.rank);
  }
}
