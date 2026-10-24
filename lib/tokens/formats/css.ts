import { gradientCssFallback } from "@/lib/color/gradient";
import type { DesignTokens } from "@/types/tokens";
import { flatten, fontImport, header, variable } from "@/lib/tokens/formats/shared";
import { defineFormat } from "@/lib/tokens/formats/define";

export function toCss(tokens: DesignTokens): string {
  const flat = flatten(tokens);
  const lines = flat.map((token) => {
    // Semantic colors reference the palette so rebranding is a one-line change.
    const role = tokens.semantic.find((item) => `color-${item.name}` === token.name);
    const inPalette = role && tokens.colors.some((color) => color.name === role.ref);
    const value = role && inPalette ? `var(${variable(tokens, `color-${role.ref}`)}, ${token.value})` : token.value;
    return `  ${variable(tokens, token.name)}: ${value};`;
  });
  const fallback = tokens.gradient
    ? `\n@supports not (background: linear-gradient(in oklch, red, blue)) {\n  :root {\n    ${variable(tokens, "gradient-primary")}: ${gradientCssFallback(tokens.gradient)};\n  }\n}\n`
    : "";
  return `${header(tokens, (text) => `/* ${text} */`)}\n${fontImport(tokens)}:root {\n${lines.join("\n")}\n}\n${fallback}`;
}

export const cssFormat = defineFormat({
  id: "css",
  label: "CSS variables",
  filename: "tokens.css",
  language: "css",
  generate: toCss,
});
