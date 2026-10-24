import { oklch, readableTextColor, toHex } from "@/lib/color/color";
import { generateShades } from "@/lib/color/shades";
import type { Oklch } from "@/types/color";
import type { DesignTokens } from "@/types/tokens";
import { header } from "@/lib/tokens/formats/shared";
import { defineFormat } from "@/lib/tokens/formats/define";

/** Positions on the 50 to 950 shade ramp (0 is 50, 10 is 950) for Radix's steps 1 to 7, light and dark. */
const RADIX_LIGHT = [0, 0.5, 1, 1.5, 2, 3, 3.5];

const RADIX_DARK = [10, 9.5, 9, 8.5, 8, 7, 6.5];

/** Steps 11 and 12 (text), light and dark. */
const RADIX_TEXT_LIGHT = [7, 9];

const RADIX_TEXT_DARK = [3, 1];

function lerpColor(from: Oklch, to: Oklch, amount: number): Oklch {
  return oklch(
    from.l + (to.l - from.l) * amount,
    from.c + (to.c - from.c) * amount,
    from.h + (to.h - from.h) * amount,
    from.alpha,
  );
}

/** Radix's 12 steps for one palette color: steps 1 to 7, 11 and 12 from the ramp, step 9 the color itself. */
function radixScale(token: DesignTokens["colors"][number], dark: boolean): Oklch[] {
  const shades =
    token.shades.length >= 11
      ? token.shades
      : generateShades(token.value).map((shade) => ({ step: shade.step, value: shade.color }));
  const ramp = [...shades].sort((a, b) => a.step - b.step);
  const at = (position: number) => {
    const low = Math.floor(position);
    const high = Math.min(ramp.length - 1, Math.ceil(position));
    return lerpColor(ramp[low].value, ramp[high].value, position - low);
  };
  const base = token.value;
  const anchor = ramp.reduce(
    (best, shade, index) => (Math.abs(shade.value.l - base.l) < Math.abs(ramp[best].value.l - base.l) ? index : best),
    0,
  );
  const neighbor = ramp[Math.min(ramp.length - 1, Math.max(0, anchor + (dark ? -1 : 1)))].value;
  const [text11, text12] = (dark ? RADIX_TEXT_DARK : RADIX_TEXT_LIGHT).map(at);
  const steps = (dark ? RADIX_DARK : RADIX_LIGHT).map(at);
  return [...steps, lerpColor(steps[6], base, 0.5), base, lerpColor(base, neighbor, 0.5), text11, text12];
}

/**
 * Radix Themes (radix-theme.css): overrides the `--accent-*` and `--gray-*` scales and
 * `--radius-factor`. Each 12 step scale takes steps 1 to 7, 11 and 12 from the 50 to 950 shades
 * (blended between two shades for the in-between steps), step 9 is the color itself, step 8 sits
 * halfway between step 7 and step 9, and step 10 halfway to the neighbouring shade. Load it after
 * the Radix Themes stylesheet.
 */
export function toRadixThemeCss(tokens: DesignTokens): string {
  const primary = tokens.semantic.find((role) => role.name === "primary")?.ref;
  const neutral = tokens.semantic.find((role) => ["neutral", "foreground"].includes(role.name))?.ref;
  const accentToken = tokens.colors.find((token) => token.name === primary) ?? tokens.colors[0];
  const grayToken = tokens.colors.find((token) => token.name === neutral) ?? accentToken;
  const md = tokens.radius.find((step) => step.name === "md");
  // Radix's medium radius is 6px at a factor of 1.
  const factor = md ? Math.round((md.px / 6) * 100) / 100 : undefined;
  const scale = (name: string, token: DesignTokens["colors"][number] | undefined, dark: boolean) =>
    token ? radixScale(token, dark).map((value, index) => `  --${name}-${index + 1}: ${toHex(value)};`) : [];
  const block = (selector: string, dark: boolean) => {
    const accent = accentToken ? radixScale(accentToken, dark) : [];
    const solid = accent[8];
    const extras = solid
      ? [
          `  --accent-contrast: ${toHex(readableTextColor(solid))};`,
          `  --accent-indicator: ${toHex(solid)};`,
          `  --accent-track: ${toHex(solid)};`,
        ]
      : [];
    const lines = [...scale("accent", accentToken, dark), ...extras, ...scale("gray", grayToken, dark)];
    return `${selector} {\n${lines.join("\n")}\n}`;
  };
  return `${header(tokens, (text) => `/* ${text} */`)}
/* Radix Themes overrides. Import after "@radix-ui/themes/styles.css". */

${block(".light, .light-theme", false)}

${block(".dark, .dark-theme", true)}
${factor === undefined ? "" : `\n.radix-themes {\n  --radius-factor: ${factor};\n}\n`}`;
}

export const radixThemesFormat = defineFormat({
  id: "radix-themes",
  label: "Radix Themes",
  filename: "radix-theme.css",
  language: "css",
  generate: toRadixThemeCss,
});
