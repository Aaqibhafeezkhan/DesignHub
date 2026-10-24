import type { DesignTokens } from "@/types/tokens";
import { flatten, header } from "@/lib/tokens/formats/shared";
import { defineFormat } from "@/lib/tokens/formats/define";

export function toScss(tokens: DesignTokens): string {
  const flat = flatten(tokens);
  const name = (token: string) => `$${tokens.meta.prefix ? `${tokens.meta.prefix}-` : ""}${token.replace(/\./g, "_")}`;
  const vars = flat.map((token) => `${name(token.name)}: ${token.value};`).join("\n");
  const map = (group: string, strip: string) =>
    flat
      .filter((token) => token.group === group)
      .map((token) => `  "${token.name.replace(strip, "")}": ${name(token.name)},`)
      .join("\n");
  const maps = [
    tokens.colors.length ? `$colors: (\n${map("color", "color-")}\n);` : "",
    tokens.typography ? `$type-scale: (\n${map("text", "text-")}\n);` : "",
    tokens.spacing.length ? `$spacing: (\n${map("spacing", "spacing-")}\n);` : "",
    tokens.radius.length ? `$radii: (\n${map("radius", "radius-")}\n);` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
  return `${header(tokens, (text) => `// ${text}`)}\n@use "sass:map";\n\n${vars}\n\n${maps}\n`;
}

export const scssFormat = defineFormat({
  id: "scss",
  label: "SCSS",
  filename: "_tokens.scss",
  language: "scss",
  generate: toScss,
});
