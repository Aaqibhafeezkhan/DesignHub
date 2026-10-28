import { brandSurface } from "@/lib/brand/theme";
import { buildBrandTokens } from "@/lib/brand/tokens";
import { measureText } from "@/lib/logo/measure";
import type { MockupContext } from "@/lib/mockups/types";
import { defaultSnapshot } from "@/lib/projects/snapshot";
import { resolveSocialContent } from "@/lib/social/content";
import type { SocialContext } from "@/lib/social/types";
import type { BrandMode } from "@/types/brand";

/** The default brand, built the same way `useBrandTokens()` builds the live one. */
function drawContext(mode: BrandMode, name?: string) {
  const { brand, colors, typography, tokens, effects } = defaultSnapshot(name);
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
  return {
    brand: tokensForBrand,
    surface: brandSurface(tokensForBrand, mode),
    mode,
    fontCss: "",
    measure: measureText,
  };
}

export function socialContext(mode: BrandMode, name?: string): SocialContext {
  const draw = drawContext(mode, name);
  const { social } = defaultSnapshot(name);
  return {
    ...draw,
    content: resolveSocialContent(social.content, draw.brand),
    layout: { padding: social.design.padding, background: social.design.background },
  };
}

export function mockupContext(mode: BrandMode, name?: string): MockupContext {
  return { ...drawContext(mode, name), content: defaultSnapshot(name).mockups.content };
}
