import { toHex } from "@/lib/color/color";
import type { DesignTokens } from "@/types/tokens";
import { camel, header, tsLiteral, upperFirst } from "@/lib/tokens/formats/shared";
import { roleColor } from "@/lib/tokens/formats/shared-native";
import { defineFormat } from "@/lib/tokens/formats/define";

/** A role's color in light or dark mode as hex. */
function roleHex(tokens: DesignTokens, name: string, dark: boolean): string | undefined {
  const entry = roleColor(tokens, name, dark);
  return entry ? toHex(entry.value) : undefined;
}

/** Tamagui token keys: camelCase identifiers, so `indigo` shade 500 becomes `indigo500`. */
const tamaguiKey = (value: string) => camel(value.replace(/\./g, "_"));

/**
 * Tamagui (tamagui.config.ts): `createTokens` for color, space, size and radius, plus `light`
 * and `dark` themes from the semantic roles. Merge them into your `createTamagui` call.
 */
export function toTamaguiConfig(tokens: DesignTokens): string {
  const prefix = tokens.meta.prefix ? camel(tokens.meta.prefix) : "";
  const key = (name: string) => (prefix ? `${prefix}${upperFirst(tamaguiKey(name))}` : tamaguiKey(name));
  const colors: Record<string, string> = {};
  tokens.colors.forEach((token) => {
    colors[key(token.name)] = toHex(token.value);
    token.shades.forEach((shade) => {
      colors[key(`${token.name}-${shade.step}`)] = toHex(shade.value);
    });
  });
  const space = Object.fromEntries(tokens.spacing.map((step) => [key(step.name), step.px]));
  const radius = Object.fromEntries(tokens.radius.map((step) => [key(step.name), Math.min(step.px, 9999)]));
  const theme = (dark: boolean) =>
    Object.fromEntries(
      tokens.semantic.flatMap((role) => {
        const hex = roleHex(tokens, role.name, dark);
        return hex ? [[tamaguiKey(role.name), hex]] : [];
      }),
    );
  return `${header(tokens, (text) => `// ${text}`)}
import { createTokens } from "tamagui";

export const tokens = createTokens(${tsLiteral({
    color: colors,
    space,
    size: space,
    radius,
    zIndex: { 0: 0, 1: 100, 2: 200, 3: 300, 4: 400, 5: 500 },
  })});

export const light = ${tsLiteral(theme(false))};

export const dark = ${tsLiteral(theme(true))};

// Use them in your config: createTamagui({ ...config, tokens, themes: { light, dark } })
`;
}

export const tamaguiFormat = defineFormat({
  id: "tamagui",
  label: "Tamagui",
  filename: "tamagui.config.ts",
  language: "ts",
  generate: toTamaguiConfig,
});
