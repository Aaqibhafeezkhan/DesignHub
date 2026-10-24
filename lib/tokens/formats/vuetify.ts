import { oklch, readableTextColor, toHex } from "@/lib/color/color";
import type { DesignTokens } from "@/types/tokens";
import { header, tsLiteral } from "@/lib/tokens/formats/shared";
import type { RoleColor } from "@/lib/tokens/formats/shared-native";
import { roleColor } from "@/lib/tokens/formats/shared-native";
import { defineFormat } from "@/lib/tokens/formats/define";

/**
 * Vuetify 3 (vuetify.ts): a `createVuetify` theme with a light and a dark color set built from the
 * semantic roles, the palette as extra theme colors, and the palette's own shades reachable through
 * Vuetify's lighten and darken helpers. Colors are always hex because those helpers, and Vuetify's
 * own color classes, can't read oklch(). Border radius and the font stack are Vuetify sass
 * variables rather than theme entries, so this file does not carry them; pass them through
 * `styles/settings.scss` if the project overrides them.
 */
export function toVuetifyTheme(tokens: DesignTokens): string {
  const prefix = tokens.meta.prefix ? `${tokens.meta.prefix}-` : "";

  /** The first of these roles the tokens actually define, in light or dark mode. */
  const role = (names: string[], dark: boolean): RoleColor | undefined => {
    for (const name of names) {
      const entry = roleColor(tokens, name, dark);
      if (entry) return entry;
    }
    return undefined;
  };

  /** One step darker than a role's own value: its next palette shade, or the lightness pushed down. */
  const darken = (entry: RoleColor): string => {
    const palette = tokens.colors.find((token) => token.name === entry.color);
    const deeper = palette?.shades
      .filter((shade) => shade.value.l < entry.value.l)
      .sort((a, b) => b.value.l - a.value.l)[0];
    const value = entry.value;
    return toHex(deeper?.value ?? oklch(Math.max(0, value.l - 0.08), value.c, value.h, value.alpha));
  };

  const colors = (dark: boolean): Record<string, string> => {
    const primary = role(["primary"], dark);
    const secondary = role(["secondary", "accent"], dark) ?? primary;
    const background = role(["background"], dark);
    const palette = Object.fromEntries(tokens.colors.map((token) => [`${prefix}${token.name}`, toHex(token.value)]));
    const slots: Record<string, string> = {};
    if (background) {
      slots.background = toHex(background.value);
      // Vuetify stacks cards and sheets on `surface`, which sits one step above the page in dark
      // mode so an elevated surface still reads as raised, and is the page itself in light mode.
      const lift = dark
        ? oklch(Math.min(1, background.value.l + 0.06), background.value.c, background.value.h, background.value.alpha)
        : background.value;
      slots.surface = toHex(lift);
    }
    if (primary) {
      slots.primary = toHex(primary.value);
      slots["primary-darken-1"] = darken(primary);
      slots["on-primary"] = toHex(readableTextColor(primary.value));
    }
    if (secondary) {
      slots.secondary = toHex(secondary.value);
      slots["secondary-darken-1"] = darken(secondary);
      slots["on-secondary"] = toHex(readableTextColor(secondary.value));
    }
    // Slots win over a palette color that happens to share their name, since the slot is what
    // Vuetify's components read; the prefix setting keeps the two apart in practice.
    return { ...palette, ...slots };
  };

  return `${header(tokens, (text) => `// ${text}`)}
import { createVuetify, type ThemeDefinition } from "vuetify";

const light: ThemeDefinition = {
  dark: false,
  colors: ${tsLiteral(colors(false), "  ")},
};

const dark: ThemeDefinition = {
  dark: true,
  colors: ${tsLiteral(colors(true), "  ")},
};

export const vuetify = createVuetify({
  theme: {
    defaultTheme: "light",
    themes: { light, dark },
  },
});

export default vuetify;
`;
}

export const vuetifyFormat = defineFormat({
  id: "vuetify",
  label: "Vuetify",
  filename: "vuetify.ts",
  language: "ts",
  generate: toVuetifyTheme,
});
