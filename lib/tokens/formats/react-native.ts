import { toHex } from "@/lib/color/color";
import type { DesignTokens } from "@/types/tokens";
import { camel, header, objectKey } from "@/lib/tokens/formats/shared";
import { roleColor } from "@/lib/tokens/formats/shared-native";
import { defineFormat } from "@/lib/tokens/formats/define";

/**
 * React Native (theme.ts): the palette, light and dark semantic colors (from `roleColor()`, like
 * the Compose export), spacing and radius as numbers, font families and a type scale typed as
 * `TextStyle`, plus a `useTheme()` hook that follows the device color scheme.
 */
export function toReactNativeTheme(tokens: DesignTokens): string {
  const round = (value: number) => Math.round(value * 100) / 100;
  const rows = (entries: [string, string | number][], indent = "  ") =>
    entries.map(([key, value]) => `${indent}${objectKey(key)}: ${JSON.stringify(value)},`).join("\n");
  const unique = (entries: [string, string | number][]) => [...new Map(entries)];

  const palette = unique(
    tokens.colors.flatMap((color) => [
      [camel(color.name), toHex(color.value)] as [string, string],
      ...color.shades.map((shade) => [camel(`${color.name}-${shade.step}`), toHex(shade.value)] as [string, string]),
    ]),
  );
  const roles = (dark: boolean) =>
    tokens.semantic.flatMap((role): [string, string][] => {
      const entry = roleColor(tokens, role.name, dark);
      return entry ? [[camel(role.name), toHex(entry.value)]] : [];
    });
  const size = (items: { name: string; px: number }[]) =>
    unique(items.map((item): [string, number] => [item.name, round(item.px)]));

  const t = tokens.typography;
  const fonts = t
    ? `export const fonts = {\n${rows([
        ["heading", t.heading.family],
        ["body", t.body.family],
      ])}\n} as const;`
    : "";
  const weight = (value: number) => String(Math.min(900, Math.max(100, Math.round(value / 100) * 100)));
  const typeScale = t
    ? t.steps
        .map((step) => {
          const heading = step.maxPx >= 24;
          const rhythm = heading
            ? { weight: t.rhythm.headingWeight, line: t.rhythm.headingLineHeight, track: t.rhythm.headingTracking }
            : { weight: t.rhythm.bodyWeight, line: t.rhythm.bodyLineHeight, track: t.rhythm.bodyTracking };
          const style = {
            fontFamily: heading ? t.heading.family : t.body.family,
            fontSize: round(step.maxPx),
            lineHeight: round(step.maxPx * rhythm.line),
            fontWeight: weight(rhythm.weight),
            letterSpacing: round(step.maxPx * rhythm.track),
          };
          return `  ${objectKey(step.name)}: {\n${rows(Object.entries(style), "    ")}\n  },`;
        })
        .join("\n")
    : "";

  return `${header(tokens, (text) => `// ${text}`)}
// Load the fonts (expo-font, @expo-google-fonts or linked assets) for the family names to apply.
import { useColorScheme, type TextStyle } from "react-native";

export const palette = {
${rows(palette)}
} as const;

export const lightColors = {
${rows(roles(false))}
} as const;

export type ColorName = keyof typeof lightColors;
export type Colors = Record<ColorName, string>;

export const darkColors: Colors = {
${rows(roles(true))}
};

export const spacing = {
${rows(size(tokens.spacing))}
} as const;

export const radius = {
${rows(size(tokens.radius))}
} as const;
${fonts ? `\n${fonts}\n` : ""}${
    typeScale
      ? `
export const typography = {
${typeScale}
} as const satisfies Record<string, TextStyle>;
`
      : ""
  }
export type Theme = {
  dark: boolean;
  colors: Colors;
  spacing: typeof spacing;
  radius: typeof radius;
};

export const lightTheme: Theme = { dark: false, colors: lightColors, spacing, radius };
export const darkTheme: Theme = { dark: true, colors: darkColors, spacing, radius };

/** The light or dark theme for the device setting: const theme = useTheme(); then theme.colors.primary. */
export function useTheme(): Theme {
  return useColorScheme() === "dark" ? darkTheme : lightTheme;
}
`;
}

export const reactNativeFormat = defineFormat({
  id: "react-native",
  label: "React Native",
  filename: "theme.ts",
  language: "ts",
  generate: toReactNativeTheme,
});
