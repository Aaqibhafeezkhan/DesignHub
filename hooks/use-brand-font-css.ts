"use client";

import { useEmbeddedFont } from "@/hooks/use-embedded-font";
import type { BrandTokens } from "@/types/brand";

/** Printable ASCII plus common typographic punctuation: enough for mockup and social copy. */
const TEXT_GLYPHS =
  " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~·•’‘“”…×–";

/**
 * Inlined @font-face rules for the heading font and two body weights, so SVG mockups
 * render in the brand's fonts as images, PNGs and PDFs.
 */
export function useBrandFontCss(brand: BrandTokens): string {
  const glyphs = TEXT_GLYPHS + brand.name;
  const heading = useEmbeddedFont(brand.typography.heading, brand.typography.headingWeight, glyphs);
  const body = useEmbeddedFont(brand.typography.body, 400, glyphs);
  const bodyBold = useEmbeddedFont(brand.typography.body, 600, glyphs);
  return [heading, body, bodyBold].filter(Boolean).join("\n");
}
