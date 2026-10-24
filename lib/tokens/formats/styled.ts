import type { DesignTokens } from "@/types/tokens";
import { camel, flatten, header, objectKey, upperFirst } from "@/lib/tokens/formats/shared";
import { defineFormat } from "@/lib/tokens/formats/define";

const styledGroups: Record<string, string> = {
  color: "colors",
  semantic: "colors",
  gradient: "gradients",
  font: "fonts",
  text: "fontSizes",
  spacing: "space",
  radius: "radii",
  effect: "effects",
};

/**
 * styled-components / Emotion: a typed theme object. Group names follow the styled-system
 * scales (colors, space, radii, fonts), and the prefix setting is prepended to every key.
 */
export function toStyledTheme(tokens: DesignTokens): string {
  const prefix = tokens.meta.prefix;
  const groups = new Map<string, Map<string, string>>();
  flatten(tokens).forEach((token) => {
    const group = styledGroups[token.group] ?? token.group;
    const base = camel(token.name.replace(/^(color|gradient|font|text|spacing|radius)-/, ""));
    const key = prefix ? `${camel(prefix)}${upperFirst(base.replace(/\./g, "_"))}` : base;
    groups.set(group, (groups.get(group) ?? new Map()).set(key, token.value));
  });
  const scales = [...groups]
    .map(([group, values]) => {
      const rows = [...values].map(([key, value]) => `    ${objectKey(key)}: ${JSON.stringify(value)},`);
      return `  ${group}: {\n${rows.join("\n")}\n  },`;
    })
    .join("\n");
  return `${header(tokens, (text) => `// ${text}`)}
import "styled-components";

export const theme = {
${scales}
} as const;

export type AppTheme = typeof theme;

declare module "styled-components" {
  export interface DefaultTheme extends AppTheme {}
}

// Emotion: replace the module augmentation above with
//   import "@emotion/react";
//   declare module "@emotion/react" { export interface Theme extends AppTheme {} }
// Then pass the theme to <ThemeProvider theme={theme}> and read props.theme in styled().
`;
}

export const styledFormat = defineFormat({
  id: "styled",
  label: "styled-components",
  filename: "styled-theme.ts",
  language: "ts",
  generate: toStyledTheme,
});
