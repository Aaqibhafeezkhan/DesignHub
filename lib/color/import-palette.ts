import { fromHex } from "@/lib/color/color";
import type { Oklch } from "@/types/color";

export const MAX_IMPORTED_COLORS = 10;

export type PaletteImportResult = {
  colors: Oklch[];
  dropped: number;
};

const coolorsUrlPattern =
  /https?:\/\/(?:www\.)?coolors\.co\/(?:palette\/)?([0-9a-f]{3,6}(?:-[0-9a-f]{3,6})+)/gi;
const hexPattern = /#[0-9a-f]{3}(?![0-9a-f])|#[0-9a-f]{6}(?![0-9a-f])/gi;

function collectHexes(input: string): string[] {
  const colors: string[] = [];
  const coolorsMatches = input.matchAll(coolorsUrlPattern);

  for (const match of coolorsMatches) {
    const palette = match[1];
    if (!palette) continue;

    for (const hex of palette.split("-")) {
      if (hex.length === 3 || hex.length === 6) colors.push("#" + hex);
    }
  }

  const withoutCoolorsUrls = input.replace(coolorsUrlPattern, "");
  for (const match of withoutCoolorsUrls.matchAll(hexPattern)) {
    colors.push(match[0]);
  }

  return colors;
}

export function parsePaletteImport(input: string): PaletteImportResult {
  const hexes = collectHexes(input);
  const colors = hexes.slice(0, MAX_IMPORTED_COLORS).map(fromHex);

  return {
    colors,
    dropped: Math.max(0, hexes.length - MAX_IMPORTED_COLORS),
  };
}
