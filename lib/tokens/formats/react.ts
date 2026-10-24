import type { DesignTokens } from "@/types/tokens";
import { flatten, header } from "@/lib/tokens/formats/shared";
import { defineFormat } from "@/lib/tokens/formats/define";

export function toReactTheme(tokens: DesignTokens): string {
  const groups = new Map<string, Record<string, string>>();
  flatten(tokens).forEach((token) => {
    const key = token.group === "semantic" ? "color" : token.group;
    const name = token.name.replace(/^(color|gradient|font|text|spacing|radius)-/, "");
    groups.set(key, { ...(groups.get(key) ?? {}), [name]: token.value });
  });
  const theme = Object.fromEntries(groups);
  return `${header(tokens, (text) => `// ${text}`)}
import type { CSSProperties } from "react";

export const theme = ${JSON.stringify(theme, null, 2)} as const;

export type Theme = typeof theme;

/** Spread onto a root element to expose the theme as CSS variables: <div style={themeVars}>. */
export const themeVars = Object.fromEntries(
  Object.entries(theme).flatMap(([group, values]) =>
    Object.entries(values).map(([name, value]) => [\`--\${group}-\${name}\`, value]),
  ),
) as CSSProperties;
`;
}

export const reactFormat = defineFormat({
  id: "react",
  label: "React theme",
  filename: "theme.ts",
  language: "ts",
  generate: toReactTheme,
});
