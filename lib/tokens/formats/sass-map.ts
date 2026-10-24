import type { DesignTokens } from "@/types/tokens";
import { groupedTokens, header } from "@/lib/tokens/formats/shared";
import { defineFormat } from "@/lib/tokens/formats/define";

/**
 * Sass map (_tokens-map.scss): every group as a nested map plus a `token($group, $name)`
 * lookup. Keys are quoted strings and the function interpolates its arguments, so
 * `token(spacing, 4)` and `token("spacing", "4")` find the same entry.
 */
export function toSassMap(tokens: DesignTokens): string {
  // Commas separate map entries, so values with a comma (font stacks, layered shadows) get parentheses.
  const value = (raw: string) => (raw.includes(",") ? `(${raw})` : raw);
  const groups = [...groupedTokens(tokens)]
    .map(([group, values]) => {
      const rows = [...values].map(([key, raw]) => `    "${key}": ${value(raw)},`);
      return `  "${group}": (\n${rows.join("\n")}\n  ),`;
    })
    .join("\n");
  return `${header(tokens, (text) => `// ${text}`)}
@use "sass:map";

$tokens: (
${groups}
);

/// Looks up one token, e.g. color: token(semantic, primary); or padding: token(spacing, 4);
@function token($group, $name) {
  $group: "#{$group}";
  $name: "#{$name}";
  @if not map.has-key($tokens, $group, $name) {
    @error "Unknown token #{$group}.#{$name}";
  }
  @return map.get($tokens, $group, $name);
}
`;
}

export const sassMapFormat = defineFormat({
  id: "sass-map",
  label: "Sass map",
  filename: "_tokens-map.scss",
  language: "scss",
  generate: toSassMap,
});
