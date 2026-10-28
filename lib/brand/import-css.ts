import { parseColor, toHex } from "@/lib/color/color";
import { MAX_SWATCHES, MIN_SWATCHES } from "@/store/color-store";
import type { Oklch } from "@/types/color";

/**
 * Reads colors and font families out of pasted CSS (a stylesheet or a block of custom properties).
 * Pure: nothing here touches a store, so the caller decides what to apply and can undo it.
 */

type CssColor = {
  /** The color as `#rrggbb` (alpha is ignored: translucent colors count as their opaque base). */
  hex: string;
  color: Oklch;
  /** How many times it appears. */
  count: number;
};

type CssFont = {
  family: string;
  count: number;
  /** True when the family is in the font catalog and can be applied. */
  known: boolean;
};

export type CssImport = {
  /** Every distinct color, most frequent first (ties keep the order they appear in). */
  colors: CssColor[];
  /** Every distinct font family, most frequent first. */
  fonts: CssFont[];
  /** How many `var()` references and `currentColor` keywords were ignored. */
  ignored: number;
};

export type CssImportOptions = {
  /** Returns false for font families DesignHub can't load; those are listed but skipped. */
  isKnownFont?: (family: string) => boolean;
};

/** What applying an import would change. */
export type CssImportPlan = {
  /** The palette (at most 10 colors, ranked), or null when fewer than 2 colors were found. */
  palette: Oklch[] | null;
  headingFont: string | null;
  bodyFont: string | null;
  /** Fonts that were found but are not in the catalog. */
  skippedFonts: string[];
  /** Colors found beyond the palette limit. */
  extraColors: number;
};

const hexPattern = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})(?![\w-])/gi;
const functionPattern = /\b(?:rgba?|hsla?|oklch)\(([^()]*)\)/gi;
const declarationPattern = /(?:^|[;{}\s])(-{0,2}[a-z_][\w-]*)\s*:\s*([^;{}]+)/gi;
const currentColorPattern = /\bcurrentcolor\b/gi;

/** Generic keywords and system stacks that name no real font. */
const genericFamilies = new Set([
  "serif",
  "sans-serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui",
  "ui-serif",
  "ui-sans-serif",
  "ui-monospace",
  "ui-rounded",
  "emoji",
  "math",
  "fangsong",
  "inherit",
  "initial",
  "unset",
  "revert",
  "revert-layer",
  "-apple-system",
  "blinkmacsystemfont",
]);

const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, " ");

/** Removes `name( ... )` calls, including nested parentheses. Returns the text and how many were removed. */
function removeCalls(text: string, name: string): { text: string; removed: number } {
  const lower = text.toLowerCase();
  let out = "";
  let removed = 0;
  let index = 0;
  for (;;) {
    const start = lower.indexOf(name + "(", index);
    if (start === -1) break;
    out += text.slice(index, start) + " ";
    let depth = 0;
    let end = start + name.length;
    for (; end < text.length; end++) {
      if (text[end] === "(") depth++;
      else if (text[end] === ")" && --depth === 0) break;
    }
    index = end + 1;
    removed++;
  }
  return { text: out + text.slice(index), removed };
}

/** The value of a declaration with url(), var() and currentColor removed, plus how many references were dropped. */
function cleanValue(value: string): { text: string; ignored: number } {
  const noUrl = removeCalls(value, "url").text;
  const noVar = removeCalls(noUrl, "var");
  const currentCount = (noVar.text.match(currentColorPattern) ?? []).length;
  return { text: noVar.text.replace(currentColorPattern, " "), ignored: noVar.removed + currentCount };
}

function readFamilies(value: string): string[] {
  const families: string[] = [];
  for (const raw of value.split(",")) {
    const name = raw
      .trim()
      .replace(/\s*!important$/i, "")
      .replace(/^(["'])(.*)\1$/, "$2")
      .replace(/\s+/g, " ")
      .trim();
    if (!name || genericFamilies.has(name.toLowerCase())) continue;
    // Not a family: a number or length, or a function such as calc().
    if (/^[-+]?[\d.]/.test(name) || /[()]/.test(name)) continue;
    families.push(name);
  }
  return families;
}

/** A custom property that holds a font stack, such as `--font-sans`, but not `--font-size`. */
const isFontProperty = (name: string) =>
  name === "font-family" || (/^--.*font/i.test(name) && !/(size|weight|style|height|feature|variation)/i.test(name));

export function parseCssImport(css: string, options: CssImportOptions = {}): CssImport {
  const known = options.isKnownFont ?? (() => true);
  const colorCounts = new Map<string, CssColor>();
  const fontCounts = new Map<string, number>();
  let ignored = 0;

  for (const match of stripComments(css).matchAll(declarationPattern)) {
    const property = match[1]!.toLowerCase();
    const { text, ignored: dropped } = cleanValue(match[2]!);
    ignored += dropped;

    if (isFontProperty(property)) {
      for (const family of readFamilies(text)) fontCounts.set(family, (fontCounts.get(family) ?? 0) + 1);
      continue;
    }
    for (const token of [...text.matchAll(hexPattern), ...text.matchAll(functionPattern)]) {
      const parsed = parseColor(token[0]);
      if (!parsed || parsed.alpha === 0) continue;
      const color = { ...parsed, alpha: 1 };
      const hex = toHex(color);
      const existing = colorCounts.get(hex);
      if (existing) existing.count++;
      else colorCounts.set(hex, { hex, color, count: 1 });
    }
  }

  // Array.prototype.sort is stable, so ties keep first-seen order.
  const colors = [...colorCounts.values()].sort((a, b) => b.count - a.count);
  const fonts = [...fontCounts.entries()]
    .map(([family, count]) => ({ family, count, known: known(family) }))
    .sort((a, b) => b.count - a.count);
  return { colors, fonts, ignored };
}

/** Decides what to apply: the top colors as the palette, the two most used known fonts as heading and body. */
export function planCssImport(found: CssImport): CssImportPlan {
  const usable = found.colors.length >= MIN_SWATCHES;
  const known = found.fonts.filter((font) => font.known);
  return {
    palette: usable ? found.colors.slice(0, MAX_SWATCHES).map((entry) => entry.color) : null,
    headingFont: known[0]?.family ?? null,
    bodyFont: known[1]?.family ?? null,
    skippedFonts: found.fonts.filter((font) => !font.known).map((font) => font.family),
    extraColors: Math.max(0, found.colors.length - MAX_SWATCHES),
  };
}
