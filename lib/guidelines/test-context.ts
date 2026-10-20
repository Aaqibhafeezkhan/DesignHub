import { brandSurface } from "@/lib/brand/theme";
import { buildBrandTokens } from "@/lib/brand/tokens";
import { effectTokens } from "@/lib/effects/bundle";
import { guidelinePages } from "@/lib/guidelines/registry";
import type { GuidelineContext } from "@/lib/guidelines/types";
import { measureText } from "@/lib/logo/measure";
import { defaultSnapshot } from "@/lib/projects/snapshot";
import { buildTokens } from "@/lib/tokens/build";

/** The default brand as the guideline pages see it, built the way the hooks build it. */
export function guidelineContext(name: string, excluded: string[], mode: "light" | "dark" = "light") {
  const { brand, colors, typography, tokens, effects, logo } = defaultSnapshot(name);
  const tokensForBrand = buildBrandTokens({
    profile: brand.profile,
    swatches: colors.swatches,
    gradient: colors.gradient,
    headingFont: typography.headingFont,
    bodyFont: typography.bodyFont,
    catalog: [],
    rhythm: typography.rhythm,
    scale: typography.scale,
    radiusBase: tokens.settings.radiusBase,
    spacingBase: tokens.settings.spacingBase,
    shadowLayers: effects.settings.shadow.layers,
  });
  const surface = brandSurface(tokensForBrand, mode);
  const pages = guidelinePages.filter((page) => !excluded.includes(page.id));
  const ctx: GuidelineContext = {
    brand: tokensForBrand,
    surface,
    mode,
    fontCss: "",
    measure: measureText,
    voice: brand.profile.voice,
    mission: brand.profile.mission,
    tokens: buildTokens(
      {
        colors: colors.swatches.map((swatch) => swatch.color),
        shadeOptions: colors.shadeOptions,
        gradient: colors.gradient,
        heading: undefined,
        body: undefined,
        scale: typography.scale,
        rhythm: typography.rhythm,
        effects: effectTokens(effects.settings),
      },
      { ...tokens.settings, name },
    ),
    logo: {
      logo: tokensForBrand.logo.svg,
      name,
      fontFamily: tokensForBrand.typography.heading,
      fontWeight: tokensForBrand.typography.headingWeight,
      fontCss: "",
      measure: (text, size) => measureText(text, tokensForBrand.typography.heading, 700, size),
      primary: surface.primary,
      text: surface.text,
      light: surface.background,
      dark: brandSurface(tokensForBrand, "dark").background,
    },
    clearSpace: logo.clearSpace,
    coverStyle: "gradient",
    date: "October 2026",
    contents: pages.map((page, i) => ({ id: page.id, title: page.title, number: i + 1 })),
  };
  return { ctx, pages };
}
