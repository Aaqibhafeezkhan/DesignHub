import { parseColor, toRgb } from "@/lib/color/color";
import { defineEffect } from "@/lib/effects/define";
import type { DuotoneSettings } from "@/types/effects";

/** Id of the filter inside the data URL, so the CSS reference and the markup agree. */
export const DUOTONE_FILTER_ID = "duotone";

const round = (value: number) => Math.round(value * 10000) / 10000;

function channel(hex: string, key: "r" | "g" | "b"): number {
  const color = parseColor(hex);
  return color ? round(toRgb(color)[key] / 255) : 0;
}

/**
 * One table per channel, from the shadow color to the highlight color. feComponentTransfer
 * interpolates the grayscale value between the two, which is what turns it into a duotone.
 */
export function duotoneTableValues(settings: Pick<DuotoneSettings, "shadow" | "highlight">) {
  const table = (key: "r" | "g" | "b") => `${channel(settings.shadow, key)} ${channel(settings.highlight, key)}`;
  return { r: table("r"), g: table("g"), b: table("b") };
}

/**
 * The SVG filter: desaturate to luminance, remap each channel between the two colors, then blend
 * that result over the original at the chosen strength.
 */
export function duotoneFilterMarkup(settings: DuotoneSettings): string {
  const table = duotoneTableValues(settings);
  const strength = Math.round(Math.min(1, Math.max(0, settings.strength)) * 100) / 100;
  return `<svg xmlns='http://www.w3.org/2000/svg' width='0' height='0'><filter id='${DUOTONE_FILTER_ID}' color-interpolation-filters='sRGB'><feColorMatrix type='saturate' values='0'/><feComponentTransfer><feFuncR type='table' tableValues='${table.r}'/><feFuncG type='table' tableValues='${table.g}'/><feFuncB type='table' tableValues='${table.b}'/></feComponentTransfer><feComponentTransfer result='tinted'><feFuncA type='linear' slope='${strength}'/></feComponentTransfer><feMerge><feMergeNode in='SourceGraphic'/><feMergeNode in='tinted'/></feMerge></filter></svg>`;
}

/** The filter as a self-contained data URL, with its markup embedded in the CSS value. */
export function duotoneFilterUrl(settings: DuotoneSettings): string {
  return `url("data:image/svg+xml,${encodeURIComponent(duotoneFilterMarkup(settings))}#${DUOTONE_FILTER_ID}")`;
}

export const duotone = defineEffect({
  kind: "duotone",
  label: "Duotone",
  description: "Maps photo shadows and highlights to two brand colors with an SVG filter.",
  generate(s) {
    return {
      declarations: [{ property: "filter", value: duotoneFilterUrl(s) }],
    };
  },
});
