import { toHex, toRgb } from "@/lib/color/color";
import type { Oklch } from "@/types/color";
import type { DesignTokens } from "@/types/tokens";
import { header, variable } from "@/lib/tokens/formats/shared";
import { defineFormat } from "@/lib/tokens/formats/define";

/** Unity USS accepts hex and classic `rgba(r, g, b, a)` colors; never oklch() or color-mix(). */
function ussColor(value: Oklch): string {
  if (value.alpha < 1) {
    const { r, g, b, alpha } = toRgb(value);
    const a = Math.round(alpha * 1000) / 1000;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  return toHex(value);
}

const ussPx = (value: number) => (value === 0 ? "0" : `${value}px`);

/**
 * Unity UI Toolkit (theme.uss): `:root` custom properties for the palette, semantic roles,
 * spacing and radius. Colors are hex (or rgba() when alpha is below 1) and sizes are px, because
 * USS has no oklch() or color-mix(). Import the file in UXML or Panel Settings.
 */
export function toUnityUss(tokens: DesignTokens): string {
  const lines: string[] = [];
  tokens.colors.forEach((token) => {
    lines.push(`  ${variable(tokens, `color-${token.name}`)}: ${ussColor(token.value)};`);
    token.shades.forEach((shade) =>
      lines.push(`  ${variable(tokens, `color-${token.name}-${shade.step}`)}: ${ussColor(shade.value)};`),
    );
  });
  tokens.semantic.forEach((role) => {
    const inPalette = tokens.colors.some((color) => color.name === role.ref);
    const hex = ussColor(role.value);
    const value = inPalette ? `var(${variable(tokens, `color-${role.ref}`)}, ${hex})` : hex;
    lines.push(`  ${variable(tokens, `color-${role.name}`)}: ${value};`);
  });
  tokens.spacing.forEach((step) => lines.push(`  ${variable(tokens, `spacing-${step.name}`)}: ${ussPx(step.px)};`));
  tokens.radius.forEach((step) => lines.push(`  ${variable(tokens, `radius-${step.name}`)}: ${ussPx(step.px)};`));
  return `${header(tokens, (text) => `/* ${text} */`)}
/* Unity UI Toolkit style sheet. Import theme.uss in your UXML or Panel Settings. */
:root {
${lines.join("\n")}
}
`;
}

export const ussFormat = defineFormat({
  id: "uss",
  label: "Unity USS",
  filename: "theme.uss",
  language: "css",
  generate: toUnityUss,
});
