import type { FontFamily } from "@/types/typography";

/** CSS named weights from Thin (100) to Black (900). */
export const WEIGHT_NAMES: Record<number, string> = {
  100: "Thin",
  200: "Extra light",
  300: "Light",
  400: "Regular",
  500: "Medium",
  600: "Semibold",
  700: "Bold",
  800: "Extra bold",
  900: "Black",
};

const STANDARD_WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

export type WeightRow = {
  weight: number;
  name: string;
};

/**
 * Rows for the weight comparison strip: every static face, or the named
 * instances a variable family publishes (catalog weights within the wght axis).
 */
export function familyWeightRows(font: FontFamily | undefined): WeightRow[] {
  const weights = listFamilyWeights(font);
  return weights.map((weight) => ({
    weight,
    name: WEIGHT_NAMES[weight] ?? `Weight ${weight}`,
  }));
}

/** Numeric weights the family can show, ascending and unique. */
export function listFamilyWeights(font: FontFamily | undefined): number[] {
  if (!font) return [400];

  if (font.weights.length) {
    return [...new Set(font.weights)].sort((a, b) => a - b);
  }

  const axis = font.axes?.find((item) => item.tag === "wght");
  if (axis) {
    const named = STANDARD_WEIGHTS.filter((weight) => weight >= axis.min && weight <= axis.max);
    return named.length ? [...named] : [Math.round((axis.min + axis.max) / 2)];
  }

  return [400];
}

/** The weight a font can actually show for a requested one: clamped to its wght axis, or the closest static weight. */
export function nearestWeight(font: FontFamily | undefined, weight: number): number {
  if (!font) return weight;
  const axis = font.axes?.find((item) => item.tag === "wght");
  if (axis) return Math.min(axis.max, Math.max(axis.min, weight));
  if (font.weights.length === 0 || font.weights.includes(weight)) return weight;
  return font.weights.reduce((best, item) => (Math.abs(item - weight) < Math.abs(best - weight) ? item : best));
}

/** A second font to start comparing with: the first of the pairing fonts that differs from the active one. */
export function defaultCompareFont(active: string, candidates: string[]): string {
  return candidates.find((family) => family !== active) ?? (active === "Roboto" ? "Inter" : "Roboto");
}
