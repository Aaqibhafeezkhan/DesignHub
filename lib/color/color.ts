import {
  contrastAPCA,
  OKLCH,
  contrastWCAG21,
  deltaEOK,
  getColor,
  inGamut as isInGamut,
  to,
  toGamut,
  type ColorObject,
} from "@/lib/color/engine";

import type { ColorFormat, Oklch } from "@/types/color";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round = (value: number, precision: number) => {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

function normalizeHue(hue: number | null | undefined): number {
  if (hue === null || hue === undefined || Number.isNaN(hue)) return 0;
  return ((hue % 360) + 360) % 360;
}

export function oklch(l: number, c: number, h: number, alpha = 1): Oklch {
  return { l: clamp(l, 0, 1), c: clamp(c, 0, 0.4), h: normalizeHue(h), alpha: clamp(alpha, 0, 1) };
}

function toColor(value: Oklch): ColorObject {
  return { space: OKLCH, coords: [value.l, value.c, value.h], alpha: value.alpha };
}

const toSrgbGamut = (value: Oklch) => toGamut(toColor(value), { space: "srgb" });

/** Parses any CSS color string (hex, rgb(), hsl(), oklch(), named colors…). */
export function parseColor(input: string): Oklch | null {
  try {
    const color = to(getColor(input.trim()), "oklch");
    const [l, c, h] = color.coords;
    return oklch(l ?? 0, c ?? 0, h ?? 0, color.alpha ?? 1);
  } catch {
    return null;
  }
}

export function fromHex(hex: string): Oklch {
  return parseColor(hex) ?? oklch(0, 0, 0);
}

/** sRGB channels 0–255 after gamut mapping (CSS Color 4 algorithm). */
export function toRgb(value: Oklch): { r: number; g: number; b: number; alpha: number } {
  const srgb = to(toSrgbGamut(value), "srgb");
  const [r, g, b] = srgb.coords;
  return {
    r: Math.round(clamp(r ?? 0, 0, 1) * 255),
    g: Math.round(clamp(g ?? 0, 0, 1) * 255),
    b: Math.round(clamp(b ?? 0, 0, 1) * 255),
    alpha: value.alpha,
  };
}

export function toHex(value: Oklch): string {
  const { r, g, b, alpha } = toRgb(value);
  const hex = [r, g, b].map((channel) => channel.toString(16).padStart(2, "0")).join("");
  return `#${hex}${
    alpha < 1
      ? Math.round(alpha * 255)
          .toString(16)
          .padStart(2, "0")
      : ""
  }`;
}

function toHsl(value: Oklch): { h: number; s: number; l: number } {
  const hsl = to(toSrgbGamut(value), "hsl");
  const [h, s, l] = hsl.coords;
  return { h: Math.round(normalizeHue(h)), s: Math.round(s ?? 0), l: Math.round(l ?? 0) };
}

export function formatColor(value: Oklch, format: ColorFormat): string {
  const alpha = value.alpha < 1 ? ` / ${round(value.alpha, 2)}` : "";
  switch (format) {
    case "hex":
      return toHex(value);
    case "rgb": {
      const { r, g, b } = toRgb(value);
      return `rgb(${r} ${g} ${b}${alpha})`;
    }
    case "hsl": {
      const { h, s, l } = toHsl(value);
      return `hsl(${h} ${s}% ${l}%${alpha})`;
    }
    case "oklch":
      return `oklch(${round(value.l * 100, 2)}% ${round(value.c, 4)} ${round(value.h, 2)}${alpha})`;
  }
}

export function inGamut(value: Oklch, space: "srgb" | "p3" = "srgb"): boolean {
  return isInGamut(toColor(value), space);
}

/** WCAG 2.1 contrast ratio between two colors (1–21). */
export function contrastRatio(a: Oklch, b: Oklch): number {
  return contrastWCAG21(toSrgbGamut(a), toSrgbGamut(b));
}

/**
 * APCA lightness contrast (Lc) of text on a background, the method proposed for WCAG 3.
 * It is signed: positive for dark text on a light background, negative for light on dark.
 */
export function apcaContrast(text: Oklch, background: Oklch): number {
  return contrastAPCA(toSrgbGamut(background), toSrgbGamut(text));
}

/** Relative luminance-based pick between black and white text. */
export function readableTextColor(background: Oklch): Oklch {
  const white = oklch(1, 0, 0);
  const black = oklch(0, 0, 0);
  return contrastRatio(background, white) >= contrastRatio(background, black) ? white : black;
}

export function isSameColor(a: Oklch, b: Oklch): boolean {
  return toHex(a) === toHex(b);
}

/** Perceptual distance (ΔE OK). Values below ~0.02 are hard to tell apart. */
export function colorDistance(a: Oklch, b: Oklch): number {
  return deltaEOK(toColor(a), toColor(b));
}
