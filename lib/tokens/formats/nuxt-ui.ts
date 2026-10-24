import type { DesignTokens } from "@/types/tokens";
import { header } from "@/lib/tokens/formats/shared";
import { defineFormat } from "@/lib/tokens/formats/define";

/** Nuxt UI v3 app.config.ts maps semantic brand roles to their source palette names. */
export function toNuxtUiConfig(tokens: DesignTokens): string {
  const role = (names: string[], fallback: string) => {
    const item = tokens.semantic.find((entry) => names.includes(entry.name));
    return item?.ref ?? tokens.colors.find((color) => color.name === fallback)?.name ?? fallback;
  };
  const config = {
    ui: {
      colors: {
        primary: role(["primary"], "primary"),
        secondary: role(["secondary", "accent"], "secondary"),
        neutral: role(["neutral", "foreground"], "neutral"),
      },
    },
  };
  return `${header(tokens, (text) => `// ${text}`)}\nexport default defineAppConfig(${JSON.stringify(config, null, 2)});\n`;
}

export const nuxtUiFormat = defineFormat({
  id: "nuxt-ui",
  label: "Nuxt UI v3",
  filename: "app.config.ts",
  language: "ts",
  generate: toNuxtUiConfig,
});
