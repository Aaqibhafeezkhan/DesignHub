import { formatColor } from "@/lib/color/color";
import { fontStack } from "@/lib/typography/css";
import type { Oklch } from "@/types/color";
import type { DesignTokens } from "@/types/tokens";
import { effectScale, header, nonEmpty, px, tsLiteral } from "@/lib/tokens/formats/shared";
import { defineFormat } from "@/lib/tokens/formats/define";

/**
 * UnoCSS (uno.config.ts): the tokens as a `presetWind3` theme. Colors with shades become
 * { DEFAULT, 50, 100… } objects so both `bg-indigo` and `bg-indigo-500` work, and the prefix
 * setting is prepended to every theme key (`bg-acme-indigo-500`).
 */
export function toUnoConfig(tokens: DesignTokens): string {
  const prefix = tokens.meta.prefix ? `${tokens.meta.prefix}-` : "";
  const color = (value: Oklch) => formatColor(value, tokens.meta.colorFormat);
  const t = tokens.typography;
  const theme = nonEmpty({
    colors: Object.fromEntries([
      ...tokens.colors.map((token) => [
        `${prefix}${token.name}`,
        token.shades.length
          ? { DEFAULT: color(token.value), ...Object.fromEntries(token.shades.map((s) => [s.step, color(s.value)])) }
          : color(token.value),
      ]),
      ...tokens.semantic.map((role) => [`${prefix}${role.name}`, color(role.value)]),
    ]),
    fontFamily: t
      ? {
          [`${prefix}heading`]: fontStack(t.heading.family, t.heading.category),
          [`${prefix}body`]: fontStack(t.body.family, t.body.category),
        }
      : {},
    fontSize: Object.fromEntries(
      (t?.steps ?? []).map((step) => [
        `${prefix}${step.name}`,
        [step.clamp, String(step.step > 0 ? t!.rhythm.headingLineHeight : t!.rhythm.bodyLineHeight)],
      ]),
    ),
    spacing: Object.fromEntries(tokens.spacing.map((s) => [`${prefix}${s.name}`, px(s.px)])),
    borderRadius: Object.fromEntries(tokens.radius.map((r) => [`${prefix}${r.name}`, px(r.px)])),
    boxShadow: effectScale(tokens, "shadow", prefix),
    blur: effectScale(tokens, "blur", prefix),
  });
  return `${header(tokens, (text) => `// ${text}`)}
import { defineConfig, presetWind3, type PresetWind3Theme } from "unocss";

export default defineConfig<PresetWind3Theme>({
  presets: [presetWind3()],
  theme: ${tsLiteral(theme, "  ")},
});
`;
}

export const unocssFormat = defineFormat({
  id: "unocss",
  label: "UnoCSS",
  filename: "uno.config.ts",
  language: "ts",
  generate: toUnoConfig,
});
