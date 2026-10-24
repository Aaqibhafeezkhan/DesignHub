import { formatColor } from "@/lib/color/color";
import { gradientCss } from "@/lib/color/gradient";
import type { Oklch } from "@/types/color";
import type { DesignTokens } from "@/types/tokens";
import { header, px } from "@/lib/tokens/formats/shared";
import { defineFormat } from "@/lib/tokens/formats/define";

export function toTailwindConfig(tokens: DesignTokens): string {
  const color = (value: Oklch) => formatColor(value, tokens.meta.colorFormat);
  const colors = Object.fromEntries([
    ...tokens.colors.map((token) => [
      token.name,
      token.shades.length
        ? { DEFAULT: color(token.value), ...Object.fromEntries(token.shades.map((s) => [s.step, color(s.value)])) }
        : color(token.value),
    ]),
    ...tokens.semantic.map((role) => [role.name, color(role.value)]),
  ]);
  const t = tokens.typography;
  const theme = {
    colors,
    ...(t
      ? {
          fontFamily: {
            heading: [t.heading.family, t.heading.category],
            body: [t.body.family, t.body.category],
          },
          fontSize: Object.fromEntries(
            t.steps.map((step) => [
              step.name,
              [
                step.clamp,
                { lineHeight: String(step.step > 0 ? t.rhythm.headingLineHeight : t.rhythm.bodyLineHeight) },
              ],
            ]),
          ),
        }
      : {}),
    ...(tokens.spacing.length ? { spacing: Object.fromEntries(tokens.spacing.map((s) => [s.name, px(s.px)])) } : {}),
    ...(tokens.radius.length ? { borderRadius: Object.fromEntries(tokens.radius.map((r) => [r.name, px(r.px)])) } : {}),
    ...(tokens.gradient ? { backgroundImage: { "gradient-primary": gradientCss(tokens.gradient) } } : {}),
  };
  return `${header(tokens, (text) => `// ${text}`)}
// Tailwind CSS v3 - for v4 use the CSS @theme export instead.
import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx,js,jsx,html}"],
  theme: {
    extend: ${JSON.stringify(theme, null, 2).replace(/\n/g, "\n    ")},
  },
} satisfies Config;
`;
}

export const tailwindConfigFormat = defineFormat({
  id: "tailwind-config",
  label: "Tailwind config",
  filename: "tailwind.config.ts",
  language: "ts",
  generate: toTailwindConfig,
});
