import { contrastRatio } from "@/lib/color/color";
import { namedPalette } from "@/lib/color/export";
import type { ShadeOptions } from "@/lib/color/shades";
import { generateScale } from "@/lib/typography/scale";
import type { Gradient, Oklch } from "@/types/color";
import type { DesignTokens, TokenSettings } from "@/types/tokens";
import type { FontFamily, TextRhythm, TypeScaleSettings } from "@/types/typography";

export type TokenSources = {
  colors: Oklch[];
  shadeOptions: ShadeOptions;
  gradient: Gradient;
  heading: FontFamily | undefined;
  body: FontFamily | undefined;
  scale: TypeScaleSettings;
  rhythm: TextRhythm;
  effects: { name: string; value: string }[];
};

const spacingMultipliers: [string, number][] = [
  ["0", 0],
  ["px", 0.125],
  ["0.5", 0.25],
  ["1", 0.5],
  ["2", 1],
  ["3", 1.5],
  ["4", 2],
  ["6", 3],
  ["8", 4],
  ["12", 6],
  ["16", 8],
  ["24", 12],
];

const radiusMultipliers: [string, number][] = [
  ["none", 0],
  ["sm", 1 / 3],
  ["md", 2 / 3],
  ["lg", 1],
  ["xl", 4 / 3],
  ["2xl", 2],
  ["full", 9999],
];

/** The spacing scale for a base unit, the same steps the Export Engine emits. */
export function spacingScale(base: number): DesignTokens["spacing"] {
  return spacingMultipliers.map(([name, multiplier]) => ({ name, px: multiplier * base }));
}

/** The radius scale for a base radius; `full` is 9999. */
export function radiusScale(base: number): DesignTokens["radius"] {
  return radiusMultipliers.map(([name, multiplier]) => ({
    name,
    px: multiplier === 9999 ? 9999 : Math.round(multiplier * base),
  }));
}

/**
 * Chooses semantic roles from the palette: the most chromatic color becomes
 * primary, the darkest neutral-ish color becomes foreground, the lightest background.
 */
function semanticRoles(colors: DesignTokens["colors"]): DesignTokens["semantic"] {
  if (colors.length === 0) return [];
  const byChroma = [...colors].sort((a, b) => b.value.c - a.value.c);
  const byLightness = [...colors].sort((a, b) => a.value.l - b.value.l);
  const primary = byChroma[0];
  const accent = byChroma[1] ?? primary;
  const dark = byLightness[0];
  const light = byLightness[byLightness.length - 1];
  if (!primary || !accent || !dark || !light) return [];

  const background = light.value.l > 0.85 ? light : { name: "white", value: { l: 1, c: 0, h: 0, alpha: 1 } };
  const foreground =
    contrastRatio(dark.value, background.value) >= 4.5
      ? dark
      : { name: "black", value: { l: 0.15, c: 0, h: 0, alpha: 1 } };

  return [
    { name: "primary", ref: primary.name, value: primary.value },
    { name: "accent", ref: accent.name, value: accent.value },
    { name: "foreground", ref: foreground.name, value: foreground.value },
    { name: "background", ref: background.name, value: background.value },
  ];
}

export function buildTokens(sources: TokenSources, settings: TokenSettings): DesignTokens {
  const { sections } = settings;
  const colors = sections.colors
    ? namedPalette(sources.colors, sources.shadeOptions).map((color) => ({
        name: color.name,
        value: color.color,
        shades: sections.shades ? color.shades.map((shade) => ({ step: shade.step, value: shade.color })) : [],
      }))
    : [];

  const typography =
    sections.typography && sources.heading && sources.body
      ? { heading: sources.heading, body: sources.body, steps: generateScale(sources.scale), rhythm: sources.rhythm }
      : null;

  return {
    meta: {
      name: settings.name,
      prefix: settings.prefix.replace(/[^a-z0-9-]/gi, "").toLowerCase(),
      generatedAt: new Date().toISOString(),
      colorFormat: settings.colorFormat,
    },
    colors,
    semantic: sections.colors ? semanticRoles(colors) : [],
    gradient: sections.gradient ? sources.gradient : null,
    typography,
    // Older saved settings predate this section, so treat "missing" as enabled.
    effects: (sections.effects ?? true) ? sources.effects : [],
    spacing: sections.spacing ? spacingScale(settings.spacingBase) : [],
    radius: sections.radius ? radiusScale(settings.radiusBase) : [],
  };
}
