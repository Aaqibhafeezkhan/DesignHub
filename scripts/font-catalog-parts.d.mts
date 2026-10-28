import type { FontFamily } from "../types/typography";

export const fontCategories: string[];
export function splitCatalog(families: FontFamily[]): {
  index: [string, number][];
  details: Record<string, FontFamily[]>;
};
