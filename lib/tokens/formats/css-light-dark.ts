import { formatColor } from "@/lib/color/color";
import type { Oklch } from "@/types/color";
import type { DesignTokens } from "@/types/tokens";
import { header, variable } from "@/lib/tokens/formats/shared";
import { roleColor } from "@/lib/tokens/formats/shared-native";
import { defineFormat } from "@/lib/tokens/formats/define";

/** Semantic colors as `light-dark(light, dark)` so one declaration covers both themes. Names match toCss(). */
export function toCssLightDark(tokens: DesignTokens): string {
  const color = (value: Oklch) => formatColor(value, tokens.meta.colorFormat);
  const lines = tokens.semantic.flatMap((item) => {
    const light = roleColor(tokens, item.name);
    const dark = roleColor(tokens, item.name, true);
    if (!light || !dark) return [];
    return [`  ${variable(tokens, `color-${item.name}`)}: light-dark(${color(light.value)}, ${color(dark.value)});`];
  });
  return `${header(tokens, (text) => `/* ${text} */`)}\n:root {\n  color-scheme: light dark;\n${lines.join("\n")}\n}\n`;
}

export const cssLightDarkFormat = defineFormat({
  id: "css-light-dark",
  label: "CSS light-dark()",
  filename: "light-dark.css",
  language: "css",
  generate: toCssLightDark,
});
