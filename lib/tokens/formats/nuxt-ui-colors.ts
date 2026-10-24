import { toHex } from "@/lib/color/color";
import type { DesignTokens } from "@/types/tokens";
import { header } from "@/lib/tokens/formats/shared";
import { defineFormat } from "@/lib/tokens/formats/define";

/** Nuxt UI v3 CSS palette variables for each semantic brand role. */
export function toNuxtUiColorsCss(tokens: DesignTokens): string {
  const roles = [
    { output: "primary", names: ["primary"], fallback: "primary" },
    { output: "secondary", names: ["secondary", "accent"], fallback: "secondary" },
    { output: "neutral", names: ["neutral", "foreground"], fallback: "neutral" },
  ];
  const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  const lines = roles.flatMap(({ output, names, fallback }) => {
    const semantic = tokens.semantic.find((item) => names.includes(item.name));
    const palette = tokens.colors.find((item) => item.name === (semantic?.ref ?? fallback));
    if (!palette) return [];
    return steps.map((step) => {
      const shade = palette.shades.find((item) => item.step === step);
      return `  --ui-color-${output}-${step}: ${toHex(shade?.value ?? palette.value)};`;
    });
  });
  return `${header(tokens, (text) => `/* ${text} */`)}\n:root {\n${lines.join("\n")}\n}\n`;
}

export const nuxtUiColorsFormat = defineFormat({
  id: "nuxt-ui-colors",
  label: "Nuxt UI v3 color variables",
  filename: "nuxt-ui-colors.css",
  language: "css",
  generate: toNuxtUiColorsCss,
});
