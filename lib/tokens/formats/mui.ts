import { oklch, readableTextColor, toHex } from "@/lib/color/color";
import { fontStack } from "@/lib/typography/css";
import type { DesignTokens } from "@/types/tokens";
import type { Literal } from "@/lib/tokens/formats/shared";
import { header, tsLiteral } from "@/lib/tokens/formats/shared";
import type { RoleColor } from "@/lib/tokens/formats/shared-native";
import { roleColor } from "@/lib/tokens/formats/shared-native";
import { defineFormat } from "@/lib/tokens/formats/define";

/**
 * One stop of MUI's light / main / dark ramp next to a role's own value: the nearest palette shade
 * in that direction, or the lightness nudged when the palette has no shade that way.
 */
function rampStop(tokens: DesignTokens, entry: RoleColor, direction: -1 | 1): string {
  const palette = tokens.colors.find((token) => token.name === entry.color);
  const nearest = (palette?.shades ?? [])
    .filter((shade) => (direction === 1 ? shade.value.l > entry.value.l : shade.value.l < entry.value.l))
    .sort((a, b) => Math.abs(a.value.l - entry.value.l) - Math.abs(b.value.l - entry.value.l));
  const value = entry.value;
  const fallback = oklch(Math.min(1, Math.max(0, value.l + direction * 0.12)), value.c, value.h, value.alpha);
  return toHex(nearest[0]?.value ?? fallback);
}

/**
 * Material UI v6 (theme.ts): a `createTheme` with a light and a dark color scheme built from the
 * semantic roles, the palette's own shades as the light / main / dark ramp, the type scale's fonts
 * and weights, and the radius scale's middle step as `shape.borderRadius`. Colors are always hex
 * because MUI's palette functions (alpha, lighten, darken) can't read oklch(). Pass it to
 * `<ThemeProvider theme={theme}>`.
 */
export function toMaterialTheme(tokens: DesignTokens): string {
  const t = tokens.typography;

  /** The first of these roles the tokens actually define, in light or dark mode. */
  const pick = (names: string[], dark: boolean): RoleColor | undefined => {
    for (const name of names) {
      const entry = roleColor(tokens, name, dark);
      if (entry) return entry;
    }
    return undefined;
  };

  const brand = (entry: RoleColor): { [key: string]: Literal } => ({
    light: rampStop(tokens, entry, 1),
    main: toHex(entry.value),
    dark: rampStop(tokens, entry, -1),
    contrastText: toHex(readableTextColor(entry.value)),
  });

  const palette = (dark: boolean): { [key: string]: Literal } => {
    const primary = pick(["primary"], dark);
    const secondary = pick(["secondary", "accent"], dark) ?? primary;
    const background = pick(["background"], dark);
    const foreground = pick(["foreground"], dark);
    /** Cards and menus stack on `paper`, which sits one step above the page in dark mode. */
    const paper =
      dark && background
        ? oklch(Math.min(1, background.value.l + 0.06), background.value.c, background.value.h, background.value.alpha)
        : background?.value;
    return {
      ...(primary ? { primary: brand(primary) } : {}),
      ...(secondary ? { secondary: brand(secondary) } : {}),
      ...(background && paper ? { background: { default: toHex(background.value), paper: toHex(paper) } } : {}),
      ...(foreground ? { text: { primary: toHex(foreground.value) } } : {}),
    };
  };

  const light = palette(false);
  const dark = palette(true);
  const radius = tokens.radius.find((step) => step.name === "md") ?? tokens.radius.find((step) => step.name === "lg");
  const typography: { [key: string]: Literal } = {};
  if (t) {
    typography.fontFamily = fontStack(t.body.family, t.body.category);
    const heading = {
      fontFamily: fontStack(t.heading.family, t.heading.category),
      fontWeight: t.rhythm.headingWeight,
    };
    for (const variant of ["h1", "h2", "h3", "h4", "h5", "h6"]) typography[variant] = heading;
    for (const variant of ["body1", "body2", "subtitle1", "subtitle2"]) {
      typography[variant] = { fontWeight: t.rhythm.bodyWeight };
    }
  }
  const theme: { [key: string]: Literal } = {
    ...(Object.keys(light).length || Object.keys(dark).length
      ? {
          colorSchemes: {
            ...(Object.keys(light).length ? { light: { palette: light } } : {}),
            ...(Object.keys(dark).length ? { dark: { palette: dark } } : {}),
          },
        }
      : {}),
    ...(Object.keys(typography).length ? { typography } : {}),
    ...(radius ? { shape: { borderRadius: radius.px } } : {}),
  };
  return `${header(tokens, (text) => `// ${text}`)}
import { createTheme } from "@mui/material/styles";

export const theme = createTheme(${tsLiteral(theme)});

export default theme;
`;
}

export const muiFormat = defineFormat({
  id: "mui",
  label: "Material UI",
  filename: "theme.ts",
  language: "ts",
  generate: toMaterialTheme,
});
