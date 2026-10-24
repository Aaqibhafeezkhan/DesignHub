import type { DesignTokens } from "@/types/tokens";
import { flatten, header } from "@/lib/tokens/formats/shared";
import { defineFormat } from "@/lib/tokens/formats/define";

/**
 * Stylus variables with the same names as the SCSS export, plus hashes for each scale.
 * Values with functions (clamp, gradients, rgb() with a "/") go through unquote() so Stylus
 * passes them through instead of evaluating the math.
 */
export function toStylus(tokens: DesignTokens): string {
  const flat = flatten(tokens);
  const name = (token: string) => `$${tokens.meta.prefix ? `${tokens.meta.prefix}-` : ""}${token.replace(/\./g, "_")}`;
  const value = (raw: string) => (raw.includes("(") ? `unquote(${JSON.stringify(raw)})` : raw);
  const vars = flat.map((token) => `${name(token.name)} = ${value(token.value)}`).join("\n");
  const hash = (group: string, strip: string) =>
    flat
      .filter((token) => token.group === group)
      .map((token) => `  "${token.name.replace(strip, "")}": ${name(token.name)}`)
      .join("\n");
  const hashes = [
    tokens.colors.length ? `$colors = {\n${hash("color", "color-")}\n}` : "",
    tokens.typography ? `$type-scale = {\n${hash("text", "text-")}\n}` : "",
    tokens.spacing.length ? `$spacing = {\n${hash("spacing", "spacing-")}\n}` : "",
    tokens.radius.length ? `$radii = {\n${hash("radius", "radius-")}\n}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
  return `${header(tokens, (text) => `// ${text}`)}\n${vars}\n${hashes ? `\n${hashes}\n` : ""}`;
}

export const stylusFormat = defineFormat({
  id: "stylus",
  label: "Stylus",
  filename: "tokens.styl",
  language: "css",
  generate: toStylus,
});
