import type { FontCategory } from "@/types/typography";

/** Vertical and average-width metrics used to build a size-adjusted fallback face. */
export type FontMetrics = {
  /** Distance above the baseline, in font units (always positive). */
  ascent: number;
  /** Distance below the baseline, in font units (always positive). */
  descent: number;
  /** Extra leading between lines, in font units. */
  lineGap: number;
  unitsPerEm: number;
  /** Average glyph advance width in font units (latin `xWidthAvg` / `xAvgCharWidth`). */
  avgCharWidth: number;
};

/** Ratios (0-1 scale) for CSS `@font-face` metric descriptors. */
export type FallbackOverrides = {
  sizeAdjust: number;
  ascentOverride: number;
  descentOverride: number;
  lineGapOverride: number;
};

export type SystemFallback = {
  /** Name passed to `local(...)`. */
  localName: string;
  metrics: FontMetrics;
};

/**
 * Capsize / OS/2 metrics for the local fonts each category targets.
 * `avgCharWidth` drives `size-adjust`; vertical fields are unused in the override
 * formulas (those come from the web font) but document the local face.
 */
const systemFallbacks: Record<"Arial" | "Times New Roman" | "Courier New", SystemFallback> = {
  Arial: {
    localName: "Arial",
    metrics: {
      ascent: 1854,
      descent: 434,
      lineGap: 67,
      unitsPerEm: 2048,
      avgCharWidth: 913,
    },
  },
  "Times New Roman": {
    localName: "Times New Roman",
    metrics: {
      ascent: 1825,
      descent: 443,
      lineGap: 87,
      unitsPerEm: 2048,
      avgCharWidth: 832,
    },
  },
  "Courier New": {
    localName: "Courier New",
    metrics: {
      ascent: 1705,
      descent: 615,
      lineGap: 0,
      unitsPerEm: 2048,
      avgCharWidth: 1229,
    },
  },
};

const categoryFallback: Record<FontCategory, SystemFallback> = {
  "sans-serif": systemFallbacks.Arial,
  display: systemFallbacks.Arial,
  handwriting: systemFallbacks.Arial,
  serif: systemFallbacks["Times New Roman"],
  monospace: systemFallbacks["Courier New"],
};

/** Local system font whose `size-adjust` numbers this category is computed against. */
export function systemFallbackFor(category: FontCategory): SystemFallback {
  return categoryFallback[category];
}

/**
 * Compute `size-adjust` and metric overrides so a local fallback matches the web
 * font's average width and vertical metrics (Chrome / Fontaine formula).
 */
export function computeFallbackOverrides(web: FontMetrics, fallbackAvgCharWidth: number): FallbackOverrides {
  if (web.unitsPerEm <= 0 || web.avgCharWidth <= 0 || fallbackAvgCharWidth <= 0) {
    throw new Error("Font metrics must be positive");
  }
  const sizeAdjust = web.avgCharWidth / fallbackAvgCharWidth;
  const scale = web.unitsPerEm * sizeAdjust;
  return {
    sizeAdjust,
    ascentOverride: web.ascent / scale,
    descentOverride: web.descent / scale,
    lineGapOverride: web.lineGap / scale,
  };
}

/** Format a unitless ratio as a CSS percentage with up to four decimal places. */
export function formatPercent(ratio: number): string {
  const pct = Math.round(ratio * 1_000_000) / 10_000;
  return `${Number(pct.toFixed(4))}%`;
}

export function fallbackFamilyName(family: string): string {
  return `${family} Fallback`;
}

export function formatFallbackFontFace(input: {
  familyName: string;
  localName: string;
  overrides: FallbackOverrides;
}): string {
  const { familyName, localName, overrides } = input;
  return `@font-face {
  font-family: "${familyName}";
  src: local("${localName}");
  size-adjust: ${formatPercent(overrides.sizeAdjust)};
  ascent-override: ${formatPercent(overrides.ascentOverride)};
  descent-override: ${formatPercent(overrides.descentOverride)};
  line-gap-override: ${formatPercent(overrides.lineGapOverride)};
}`;
}

export type FallbackFontInput = {
  family: string;
  category: FontCategory;
  metrics: FontMetrics;
};

/**
 * Build the Fallback CSS export: one adjusted `@font-face` per font, plus a short
 * note naming the system font each face targets and how to use it in a stack.
 */
export function typographyFallbackCss(fonts: FallbackFontInput[]): string {
  const unique = fonts.filter((font, index, list) => list.findIndex((other) => other.family === font.family) === index);

  const faces = unique.map((font) => {
    const system = systemFallbackFor(font.category);
    const overrides = computeFallbackOverrides(font.metrics, system.metrics.avgCharWidth);
    const face = formatFallbackFontFace({
      familyName: fallbackFamilyName(font.family),
      localName: system.localName,
      overrides,
    });
    return `/* ${font.family}: metrics matched to local ${system.localName} */\n${face}`;
  });

  const stacks = unique.map((font) => {
    const fallback = fallbackFamilyName(font.family);
    return `/* ${font.family} stack */\n/* font-family: "${font.family}", "${fallback}", ${genericFor(font.category)}; */`;
  });

  return `/* Size-adjusted system fallbacks for the Typography pairing.
 * Put the "* Fallback" family immediately after the web font so the local face
 * holds layout until the webfont loads. Values target the system font named in
 * each @font-face comment (Arial, Times New Roman or Courier New).
 * See docs/typography-fallbacks.md.
 */

${faces.join("\n\n")}

${stacks.join("\n")}
`;
}

function genericFor(category: FontCategory): string {
  switch (category) {
    case "serif":
      return "serif";
    case "monospace":
      return "monospace";
    case "handwriting":
      return "cursive";
    default:
      return "sans-serif";
  }
}
