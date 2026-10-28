"use client";

import { useMemo } from "react";

import { useFontMeta } from "@/hooks/use-font-catalog";
import { effectTokens } from "@/lib/effects/bundle";
import { buildTokens } from "@/lib/tokens/build";
import { useBrandStore } from "@/store/brand-store";
import { useEffectsStore } from "@/store/effects-store";
import { useColorStore } from "@/store/color-store";
import { useTokensStore } from "@/store/tokens-store";
import { useTypographyStore } from "@/store/typography-store";
import type { DesignTokens } from "@/types/tokens";

/** Live design tokens assembled from every studio's local state. */
export function useDesignTokens(): DesignTokens {
  const swatches = useColorStore((state) => state.swatches);
  const shadeOptions = useColorStore((state) => state.shadeOptions);
  const gradient = useColorStore((state) => state.gradient);
  const headingFont = useTypographyStore((state) => state.headingFont);
  const bodyFont = useTypographyStore((state) => state.bodyFont);
  const scale = useTypographyStore((state) => state.scale);
  const rhythm = useTypographyStore((state) => state.rhythm);
  const settings = useTokensStore((state) => state.settings);
  const effectSettings = useEffectsStore((state) => state.settings);
  // The brand owns the name; token settings no longer keep their own copy.
  const brandName = useBrandStore((state) => state.profile.name);
  const heading = useFontMeta(headingFont);
  const body = useFontMeta(bodyFont);

  return useMemo(
    () =>
      buildTokens(
        {
          colors: swatches.map((swatch) => swatch.color),
          shadeOptions,
          gradient,
          heading,
          body,
          scale,
          rhythm,
          effects: effectTokens(effectSettings),
        },
        { ...settings, name: brandName.trim() || settings.name },
      ),
    [swatches, shadeOptions, gradient, heading, body, scale, rhythm, settings, effectSettings, brandName],
  );
}
