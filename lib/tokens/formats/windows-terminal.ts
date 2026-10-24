import { contrastRatio, fromHex, oklch, readableTextColor, toHex } from "@/lib/color/color";
import { suggestForeground } from "@/lib/color/contrast";
import type { Oklch } from "@/types/color";
import type { DesignTokens } from "@/types/tokens";
import { defineFormat } from "@/lib/tokens/formats/define";

/* -------------------------------------------------------- Windows Terminal */

/** Shortest distance on the hue circle (0 to 180). */
function hueDistance(a: number, b: number): number {
  const delta = Math.abs(a - b) % 360;
  return Math.min(delta, 360 - delta);
}

/**
 * Target hues and lightnesses for the sixteen ANSI slots. Null hue means achromatic
 * (black / white / brightBlack / brightWhite). Bright slots sit higher on the lightness axis.
 */
const ansiSlots: { key: string; hue: number | null; l: number; c: number }[] = [
  { key: "black", hue: null, l: 0.18, c: 0 },
  { key: "red", hue: 25, l: 0.55, c: 0.18 },
  { key: "green", hue: 145, l: 0.55, c: 0.16 },
  { key: "yellow", hue: 95, l: 0.75, c: 0.14 },
  { key: "blue", hue: 255, l: 0.5, c: 0.16 },
  { key: "purple", hue: 315, l: 0.55, c: 0.16 },
  { key: "cyan", hue: 195, l: 0.65, c: 0.12 },
  { key: "white", hue: null, l: 0.88, c: 0 },
  { key: "brightBlack", hue: null, l: 0.45, c: 0 },
  { key: "brightRed", hue: 25, l: 0.68, c: 0.2 },
  { key: "brightGreen", hue: 145, l: 0.72, c: 0.18 },
  { key: "brightYellow", hue: 95, l: 0.86, c: 0.15 },
  { key: "brightBlue", hue: 255, l: 0.65, c: 0.17 },
  { key: "brightPurple", hue: 315, l: 0.68, c: 0.17 },
  { key: "brightCyan", hue: 195, l: 0.78, c: 0.12 },
  { key: "brightWhite", hue: null, l: 0.96, c: 0 },
];

/** Every palette color, shade and semantic value, for matching ANSI slots. */
function paletteCandidates(tokens: DesignTokens): Oklch[] {
  const list: Oklch[] = [];
  tokens.colors.forEach((color) => {
    list.push(color.value);
    color.shades.forEach((shade) => list.push(shade.value));
  });
  tokens.semantic.forEach((role) => list.push(role.value));
  return list;
}

/**
 * Prefer a palette color whose hue is near the ANSI target (within 35 degrees). Among matches,
 * pick the closest lightness. Fall back to a color on the primary's hue ring at the target hue.
 */
function ansiColor(candidates: Oklch[], primary: Oklch, slot: (typeof ansiSlots)[number]): Oklch {
  if (slot.hue === null) {
    const nearGray = candidates
      .filter((color) => color.c < 0.04)
      .sort((a, b) => Math.abs(a.l - slot.l) - Math.abs(b.l - slot.l));
    if (nearGray[0]) return nearGray[0];
    return oklch(slot.l, 0, primary.h);
  }

  const matched = candidates
    .filter((color) => color.c >= 0.04 && hueDistance(color.h, slot.hue!) <= 35)
    .sort((a, b) => {
      const light = Math.abs(a.l - slot.l) - Math.abs(b.l - slot.l);
      if (light !== 0) return light;
      return hueDistance(a.h, slot.hue!) - hueDistance(b.h, slot.hue!);
    });
  if (matched[0]) return matched[0];

  // Hue ring around the primary: keep its chroma band, land on the ANSI hue.
  const chroma = Math.max(0.06, Math.min(0.22, primary.c || slot.c));
  return oklch(slot.l, chroma, slot.hue);
}

/** Contrast after `#rrggbb` round-trip, matching what Windows Terminal will actually use. */
function hexContrast(foreground: Oklch, background: Oklch): number {
  return contrastRatio(fromHex(toHex(foreground)), fromHex(toHex(background)));
}

/**
 * Ensures normal text reaches WCAG AA (4.5:1) on the background, measured on the exported hex.
 * Uses the semantic foreground when it already passes, otherwise a lightness nudge (aimed a
 * little above 4.5 so sRGB quantization cannot drop 4.500 to 4.496), then black or white.
 */
function readableForeground(preferred: Oklch | undefined, background: Oklch): Oklch {
  const passes = (candidate: Oklch) => hexContrast(candidate, background) >= 4.5;

  if (preferred && passes(preferred)) return preferred;
  if (preferred) {
    const nudged = suggestForeground(preferred, background, 4.6);
    if (nudged && passes(nudged)) return nudged;
    // Nudge may still land just under 4.5 after hex; step lightness toward the extreme.
    const toward = readableTextColor(background).l >= 0.5 ? 1 : 0;
    let color = nudged ?? preferred;
    for (let i = 0; i < 24 && !passes(color); i += 1) {
      color = oklch(color.l + (toward - color.l) * 0.15, color.c, color.h, color.alpha);
    }
    if (passes(color)) return color;
  }

  return readableTextColor(background);
}

/**
 * Windows Terminal (`scheme.json`): a `schemes` entry with `background`, `foreground`,
 * `cursorColor` and the sixteen ANSI colors. Hues come from the palette when it has them, and
 * from the primary's hue ring otherwise. Foreground on background is at least 4.5:1.
 */
export function toWindowsTerminalScheme(tokens: DesignTokens): string {
  const candidates = paletteCandidates(tokens);
  const primary =
    tokens.semantic.find((role) => role.name === "primary")?.value ?? tokens.colors[0]?.value ?? oklch(0.55, 0.14, 255);

  const backgroundRole = tokens.semantic.find((role) => role.name === "background")?.value;
  const background =
    backgroundRole ??
    candidates.slice().sort((a, b) => a.l - b.l)[0] ??
    oklch(0.16, Math.min(0.04, primary.c), primary.h);

  const foregroundRole = tokens.semantic.find((role) => role.name === "foreground")?.value;
  const foreground = readableForeground(foregroundRole, background);

  const cursorBase = primary.c >= 0.04 ? primary : oklch(Math.min(0.85, primary.l + 0.25), 0.14, primary.h);
  const cursorColor =
    contrastRatio(cursorBase, background) >= 3
      ? cursorBase
      : (suggestForeground(cursorBase, background, 3) ?? foreground);

  const ansi = Object.fromEntries(ansiSlots.map((slot) => [slot.key, toHex(ansiColor(candidates, primary, slot))]));

  const scheme = {
    name: tokens.meta.name,
    background: toHex(background),
    foreground: toHex(foreground),
    cursorColor: toHex(cursorColor),
    ...ansi,
  };

  return `${JSON.stringify({ schemes: [scheme] }, null, 2)}\n`;
}

export const windowsTerminalFormat = defineFormat({
  id: "windows-terminal",
  label: "Windows Terminal",
  filename: "scheme.json",
  language: "json",
  generate: toWindowsTerminalScheme,
});
