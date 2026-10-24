import { toHex } from "@/lib/color/color";
import { generateShades } from "@/lib/color/shades";
import { fontStack } from "@/lib/typography/css";
import type { DesignTokens } from "@/types/tokens";
import type { Literal } from "@/lib/tokens/formats/shared";
import { effectScale, header, nonEmpty, px, tsLiteral } from "@/lib/tokens/formats/shared";
import { defineFormat } from "@/lib/tokens/formats/define";

/** Mantine's ten shade slots (index 0 lightest to 9 darkest) mapped onto the 50 to 900 steps. */
const MANTINE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

/**
 * A color's ten Mantine shades: the token's own shade at each step when it has one, otherwise the
 * step generated from the base color, so a palette exported without shades still gets a full tuple.
 */
function mantineShades(token: DesignTokens["colors"][number]): string[] {
  const generated = generateShades(token.value);
  return MANTINE_STEPS.map((step) => {
    const own = token.shades.find((shade) => shade.step === step);
    return toHex(own?.value ?? generated.find((shade) => shade.step === step)!.color);
  });
}

/**
 * Mantine v7 (theme.ts): a `createTheme` theme with each palette color as the ten-shade tuple
 * Mantine expects, the primary role as `primaryColor`, fonts, headings, radius, spacing and
 * shadows. Colors are always hex because Mantine's color helpers (alpha, darken) can't read
 * oklch(). Pass it to `<MantineProvider theme={theme}>`.
 */
export function toMantineTheme(tokens: DesignTokens): string {
  const prefix = tokens.meta.prefix ? `${tokens.meta.prefix}-` : "";
  const t = tokens.typography;
  const primary = tokens.semantic.find((role) => role.name === "primary")?.ref;
  const primaryColor = tokens.colors.some((token) => token.name === primary) ? primary : tokens.colors[0]?.name;
  const theme: { [key: string]: Literal } = {
    ...nonEmpty({
      colors: Object.fromEntries(tokens.colors.map((token) => [`${prefix}${token.name}`, mantineShades(token)])),
    }),
    ...(primaryColor ? { primaryColor: `${prefix}${primaryColor}` } : {}),
    ...(t
      ? {
          fontFamily: fontStack(t.body.family, t.body.category),
          headings: {
            fontFamily: fontStack(t.heading.family, t.heading.category),
            fontWeight: String(t.rhythm.headingWeight),
          },
        }
      : {}),
    ...nonEmpty({
      radius: Object.fromEntries(tokens.radius.map((r) => [`${prefix}${r.name}`, px(r.px)])),
      spacing: Object.fromEntries(tokens.spacing.map((s) => [`${prefix}${s.name}`, px(s.px)])),
      shadows: effectScale(tokens, "shadow", prefix),
    }),
  };
  return `${header(tokens, (text) => `// ${text}`)}
import { createTheme } from "@mantine/core";

export const theme = createTheme(${tsLiteral(theme)});

export default theme;
`;
}

export const mantineFormat = defineFormat({
  id: "mantine",
  label: "Mantine",
  filename: "theme.ts",
  language: "ts",
  generate: toMantineTheme,
});
