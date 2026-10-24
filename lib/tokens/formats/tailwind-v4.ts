import type { DesignTokens } from "@/types/tokens";
import { cssIdent, flatten, fontImport, header } from "@/lib/tokens/formats/shared";
import { defineFormat } from "@/lib/tokens/formats/define";

/** Tailwind v4 reads design tokens from CSS `@theme` variables. */
export function toTailwindV4(tokens: DesignTokens): string {
  // DesignHub token names already follow Tailwind v4's theme namespaces (--color-*, --text-*, --radius-*…).
  const lines = flatten(tokens).map((token) => `  --${cssIdent(token.name)}: ${token.value};`);
  return `${header(tokens, (text) => `/* ${text} */`)}\n@import "tailwindcss";\n${fontImport(tokens)}\n@theme {\n${lines.join("\n")}\n}\n`;
}

export const tailwindV4Format = defineFormat({
  id: "tailwind-v4",
  label: "Tailwind v4",
  filename: "theme.css",
  language: "css",
  generate: toTailwindV4,
});
