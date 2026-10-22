import { fromHex } from "@/lib/color/color";
import type { Oklch } from "@/types/color";

export const MAX_IMPORTED_COLORS = 10;

export type PaletteImportResult = {
  colors: Oklch[];
  dropped: number;
  /** Labels from formats that carry them, such as GIMP .gpl. */
  names?: string[];
};

const coolorsUrlPattern = /https?:\/\/(?:www\.)?coolors\.co\/(?:palette\/)?([0-9a-f]{3,6}(?:-[0-9a-f]{3,6})+)/gi;
const hexPattern = /#[0-9a-f]{3}(?![0-9a-f])|#[0-9a-f]{6}(?![0-9a-f])/gi;
const gimpHeaderPattern = /^\s*GIMP Palette\b/im;
/** One exported color: space-padded R G B, a tab, then the swatch name. */
const gimpColorLinePattern = /^\s*(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\t(.*)$/;

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

function isRgbChannel(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 255;
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

/** Parse a GIMP / Inkscape / Krita .gpl body. Malformed lines are skipped. */
function parseGimpPalette(input: string): PaletteImportResult {
  const entries: { hex: string; name: string }[] = [];

  for (const rawLine of input.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (/^(GIMP Palette|Name:|Columns:)/i.test(trimmed)) continue;

    const match = rawLine.match(gimpColorLinePattern);
    if (!match) continue;

    const r = Number(match[1]);
    const g = Number(match[2]);
    const b = Number(match[3]);
    if (!isRgbChannel(r) || !isRgbChannel(g) || !isRgbChannel(b)) continue;

    const name = (match[4] ?? "").trim() || `color-${entries.length + 1}`;
    entries.push({ hex: rgbToHex(r, g, b), name });
  }

  const kept = entries.slice(0, MAX_IMPORTED_COLORS);

  return {
    colors: kept.map((entry) => fromHex(entry.hex)),
    names: kept.map((entry) => entry.name),
    dropped: Math.max(0, entries.length - MAX_IMPORTED_COLORS),
  };
}

export function parsePaletteImport(input: string): PaletteImportResult {
  if (gimpHeaderPattern.test(input)) {
    return parseGimpPalette(input);
  }

  const hexes = collectHexes(input);
  const colors = hexes.slice(0, MAX_IMPORTED_COLORS).map(fromHex);

  return {
    colors,
    dropped: Math.max(0, hexes.length - MAX_IMPORTED_COLORS),
  };
}
