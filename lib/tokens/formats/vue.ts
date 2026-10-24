import type { DesignTokens } from "@/types/tokens";
import { flatten, header } from "@/lib/tokens/formats/shared";
import { defineFormat } from "@/lib/tokens/formats/define";

/** Vue 3: the theme object,an injection key and a plugin that exposes it as CSS variables. */
export function toVueTheme(tokens: DesignTokens): string {
  const groups = new Map<string, Record<string, string>>();
  flatten(tokens).forEach((token) => {
    const key = token.group === "semantic" ? "color" : token.group;
    const name = token.name.replace(/^(color|gradient|font|text|spacing|radius)-/, "");
    groups.set(key, { ...(groups.get(key) ?? {}), [name]: token.value });
  });
  const theme = Object.fromEntries(groups);
  return `${header(tokens, (text) => `// ${text}`)}
import { inject, type App, type InjectionKey } from "vue";

export const theme = ${JSON.stringify(theme, null, 2)} as const;

export type Theme = typeof theme;

export const themeKey: InjectionKey<Theme> = Symbol("theme");

/** CSS variables for the theme, e.g. --color-primary. */
export const themeVars: Record<string, string> = Object.fromEntries(
  Object.entries(theme).flatMap(([group, values]) =>
    Object.entries(values).map(([name, value]) => [\`--\${group}-\${name}\`, value]),
  ),
);

/** app.use(themePlugin) provides the theme and writes its variables onto :root. */
export const themePlugin = {
  install(app: App) {
    app.provide(themeKey, theme);
    if (typeof document !== "undefined") {
      Object.entries(themeVars).forEach(([name, value]) => document.documentElement.style.setProperty(name, value));
    }
  },
};

/** Read the theme inside a component: const theme = useTheme(). */
export function useTheme(): Theme {
  return inject(themeKey, theme);
}
`;
}

export const vueFormat = defineFormat({
  id: "vue",
  label: "Vue theme",
  filename: "theme.ts",
  language: "ts",
  generate: toVueTheme,
});
