import { effectTokens } from "@/lib/effects/bundle";
import type { BrandSnapshot } from "@/lib/projects/snapshot";
import { buildTokens } from "@/lib/tokens/build";
import type { DesignTokens } from "@/types/tokens";
import type { FontFamily } from "@/types/typography";

/**
 * The design tokens a saved project exports: the same sources and settings the Export Engine reads
 * from the live studios (`useDesignTokens`), taken from a snapshot instead. `generatedAt` replaces
 * the build time, so the same project always produces the same files.
 */
export function tokensFromSnapshot(snapshot: BrandSnapshot, fonts: FontFamily[], generatedAt: string): DesignTokens {
  const { colors, typography, tokens, effects, brand } = snapshot;
  const built = buildTokens(
    {
      colors: colors.swatches.map((swatch) => swatch.color),
      shadeOptions: colors.shadeOptions,
      gradient: colors.gradient,
      heading: fonts.find((font) => font.family === typography.headingFont),
      body: fonts.find((font) => font.family === typography.bodyFont),
      scale: typography.scale,
      rhythm: typography.rhythm,
      effects: effectTokens(effects.settings),
    },
    { ...tokens.settings, name: brand.profile.name.trim() || tokens.settings.name },
  );
  return { ...built, meta: { ...built.meta, generatedAt } };
}
