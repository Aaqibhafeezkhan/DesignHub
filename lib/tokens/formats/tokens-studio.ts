import { toHex } from "@/lib/color/color";
import type { DesignTokens } from "@/types/tokens";
import { px } from "@/lib/tokens/formats/shared-native";
import { defineFormat } from "@/lib/tokens/formats/define";

/* ------------------------------------------------------------ Tokens Studio */

type StudioToken = { value: string | Record<string, string>; type: string; description?: string };

type StudioGroup = { [key: string]: StudioToken | StudioGroup };

const percent = (value: number) => `${Math.round(value * 1000) / 10}%`;

/**
 * Tokens Studio for Figma: one "global" set with colors, semantic aliases, spacing, radii and
 * typography, in the plugin's JSON format (load it with Tools, Load from file).
 */
export function toTokensStudio(tokens: DesignTokens): string {
  const color: StudioGroup = {};
  tokens.colors.forEach((token) => {
    const group: StudioGroup = { base: { value: toHex(token.value), type: "color" } };
    token.shades.forEach((shade) => (group[String(shade.step)] = { value: toHex(shade.value), type: "color" }));
    color[token.name] = group;
  });
  const semantic: StudioGroup = {};
  tokens.semantic.forEach((role) => {
    const inPalette = tokens.colors.some((token) => token.name === role.ref);
    semantic[role.name] = { value: inPalette ? `{color.${role.ref}.base}` : toHex(role.value), type: "color" };
  });
  const dimension = (items: { name: string; px: number }[], type: string): StudioGroup =>
    Object.fromEntries(items.map((item) => [item.name.replace(/\./g, "_"), { value: String(px(item.px)), type }]));

  const global: StudioGroup = {
    color,
    semantic,
    spacing: dimension(tokens.spacing, "spacing"),
    borderRadius: dimension(tokens.radius, "borderRadius"),
  };

  const t = tokens.typography;
  if (t) {
    global.fontFamilies = {
      heading: { value: t.heading.family, type: "fontFamilies" },
      body: { value: t.body.family, type: "fontFamilies" },
    };
    global.fontWeights = {
      heading: { value: String(t.rhythm.headingWeight), type: "fontWeights" },
      body: { value: String(t.rhythm.bodyWeight), type: "fontWeights" },
    };
    global.lineHeights = {
      heading: { value: percent(t.rhythm.headingLineHeight), type: "lineHeights" },
      body: { value: percent(t.rhythm.bodyLineHeight), type: "lineHeights" },
    };
    global.letterSpacing = {
      heading: { value: percent(t.rhythm.headingTracking), type: "letterSpacing" },
      body: { value: percent(t.rhythm.bodyTracking), type: "letterSpacing" },
    };
    global.fontSizes = Object.fromEntries(
      t.steps.map((step) => [step.name, { value: String(px(step.maxPx)), type: "fontSizes" }]),
    );
    global.typography = Object.fromEntries(
      t.steps.map((step) => {
        const role = step.maxPx >= 24 ? "heading" : "body";
        return [
          step.name,
          {
            value: {
              fontFamily: `{fontFamilies.${role}}`,
              fontWeight: `{fontWeights.${role}}`,
              lineHeight: `{lineHeights.${role}}`,
              letterSpacing: `{letterSpacing.${role}}`,
              fontSize: `{fontSizes.${step.name}}`,
            },
            type: "typography",
          },
        ];
      }),
    );
  }

  const document = {
    global,
    $themes: [],
    $metadata: { tokenSetOrder: ["global"] },
  };
  return `${JSON.stringify(document, null, 2)}\n`;
}

export const tokensStudioFormat = defineFormat({
  id: "tokens-studio",
  label: "Tokens Studio",
  filename: "tokens-studio.json",
  language: "json",
  generate: toTokensStudio,
});
