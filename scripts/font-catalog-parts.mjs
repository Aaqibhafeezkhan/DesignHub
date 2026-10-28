/**
 * Splits the font catalog into the two kinds of file the app loads: a small index (family and category, in
 * popularity order, so the rank is the position plus one) and the full details of every family, one file per
 * category. Shared by the generator and by the test that checks the files agree.
 */
export const fontCategories = ["sans-serif", "serif", "display", "handwriting", "monospace"];

/** @param {{ family: string, category: string, rank: number }[]} families sorted by rank */
export function splitCatalog(families) {
  const index = families.map((font) => [font.family, fontCategories.indexOf(font.category)]);
  const details = Object.fromEntries(
    fontCategories.map((category) => [category, families.filter((font) => font.category === category)]),
  );
  return { index, details };
}
