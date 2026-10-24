import { readableTextColor, toHex } from "@/lib/color/color";
import type { Oklch } from "@/types/color";
import type { ColorToken, DesignTokens } from "@/types/tokens";
import { header } from "@/lib/tokens/formats/shared";
import { defineFormat } from "@/lib/tokens/formats/define";

/* ------------------------------------------------------------------ Angular Material */

/** Angular Material palette keys, 50 to 900, plus the accent tones A100 to A700. */
const MAT_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

/**
 * Where the accent tones come from: Angular's own accent palettes are the same hue in the lighter
 * half (with more chroma than plain shades can express), so A100 to A700 stand in for the palette's
 * 200, 300, 400 and 500 shades. The theme file says the same in its header comment.
 */
const MAT_ACCENT_STEPS: [key: string, step: number][] = [
  ["A100", 200],
  ["A200", 300],
  ["A400", 400],
  ["A700", 500],
];

/** The step's shade, the nearest shade when the palette skips it, or the color's own value. */
function materialShade(color: ColorToken, step: number): Oklch {
  const exact = color.shades.find((shade) => shade.step === step);
  if (exact) return exact.value;
  if (!color.shades.length) return color.value;
  const nearest = [...color.shades].sort(
    (a, b) => Math.abs(a.step - step) - Math.abs(b.step - step) || a.step - b.step,
  )[0]!;
  return nearest.value;
}

/** One mat.define-palette map: the ten steps, the four accent tones, and the contrast of each. */
function materialPalette(name: string, color: ColorToken): string {
  const tone = (step: number) => toHex(materialShade(color, step));
  const contrast = (step: number) => toHex(readableTextColor(materialShade(color, step)));
  const keys = [
    ...MAT_STEPS.map((step) => `    ${step}: ${tone(step)},`),
    ...MAT_ACCENT_STEPS.map(([key, step]) => `    ${key}: ${tone(step)},`),
  ];
  const contrasts = [
    ...MAT_STEPS.map((step) => `    ${step}: ${contrast(step)},`),
    ...MAT_ACCENT_STEPS.map(([key, step]) => `    ${key}: ${contrast(step)},`),
  ];
  return `$${name}: mat.define-palette((
${keys.join("\n")}
    contrast: (
${contrasts.join("\n")}
    ),
  ));`;
}

/**
 * The Angular Material theme (`_theme.scss`): mat.define-palette maps for the primary and accent
 * colors with every shade 50 to 900 plus the accent tones A100 to A700, and a light and dark
 * define-theme pair. Include it in styles.scss, then add `@include mat.all-component-colors($theme)`
 * (and the dark pair under a .dark-theme selector) to theme every component.
 */
export function toAngularMaterialTheme(tokens: DesignTokens): string {
  const base =
    (tokens.meta.prefix || tokens.meta.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "brand";
  const ref = (role: string) =>
    tokens.colors.find((color) => color.name === tokens.semantic.find((entry) => entry.name === role)?.ref) ??
    tokens.colors[0]!;
  const primary = ref("primary");
  const accent = ref("accent");
  return `${header(tokens, (text) => `// ${text}`)}
// Angular Material theme. The palette keys 50 to 900 come from the brand's shades;
// the accent tones A100 to A700 stand in for the same palette's 200, 300, 400 and
// 500 shades (Angular's own accent palettes also raise chroma, which plain shades
// cannot express). Contrast picks white or black, whichever reads on the tone.
@use "@angular/material" as mat;

${materialPalette(`${base}-primary`, primary)}

${materialPalette(`${base}-accent`, accent)}

$${base}-theme: mat.define-light-theme((
  color: (primary: $${base}-primary, accent: $${base}-accent),
));

$${base}-dark-theme: mat.define-dark-theme((
  color: (primary: $${base}-primary, accent: $${base}-accent),
));
`;
}

export const angularMaterialFormat = defineFormat({
  id: "angular-material",
  label: "Angular Material",
  filename: "_theme.scss",
  language: "scss",
  generate: toAngularMaterialTheme,
});
