import { oklch, parseColor, toHex } from "@/lib/color/color";
import { defaultEffectContext, defineEffect } from "@/lib/effects/define";
import type { EffectContext, SkeletonSettings } from "@/types/effects";

export type SkeletonColors = {
  base: string;
  highlight: string;
  /** The page the brand-tinted block is designed for (brand source only), for the preview. */
  page?: string;
};

/** Block and highlight lightness per tone: quiet on the page, with a highlight just a step lighter. */
const TONES = {
  light: { base: 0.92, highlight: 0.97, page: 0.995 },
  dark: { base: 0.28, highlight: 0.35, page: 0.18 },
} as const;

/** Neutrals carry a hint of hue; more than this reads as a color rather than a gray. */
const MAX_CHROMA = 0.025;

/**
 * The placeholder colors: tints of the brand's first neutral (keeping its hue, at the tone's
 * lightness) or the effect's own two colors. Without a brand neutral, a plain gray.
 */
export function skeletonColors(s: SkeletonSettings, context: EffectContext): SkeletonColors {
  if (s.source === "custom") return { base: s.base, highlight: s.highlight };
  const neutral = context.neutrals.map((hex) => parseColor(hex)).find((color) => color !== null);
  const chroma = Math.min(neutral?.c ?? 0, MAX_CHROMA);
  const hue = neutral?.h ?? 0;
  const tone = TONES[s.tone];
  return {
    base: toHex(oklch(tone.base, chroma, hue)),
    highlight: toHex(oklch(tone.highlight, chroma, hue)),
    page: toHex(oklch(tone.page, chroma / 2, hue)),
  };
}

/**
 * A loading placeholder: a muted block with a soft highlight band sweeping across it. The band is a
 * gradient three times the element's width, moved by background-position. Content inside is hidden
 * (transparent text) so it keeps its layout, and reduced motion shows the plain block.
 */
export const skeleton = defineEffect({
  kind: "skeleton",
  category: "motion",
  label: "Skeleton",
  description: "A loading placeholder shimmer in your brand's neutral colors.",
  generate(s, context = defaultEffectContext) {
    const { base, highlight, page } = skeletonColors(s, context);
    return {
      declarations: [
        { property: "color", value: "transparent" },
        { property: "background-color", value: base },
        {
          property: "background-image",
          value: `linear-gradient(${s.angle}deg, ${base} 40%, ${highlight} 50%, ${base} 60%)`,
        },
        { property: "background-size", value: "300% 100%" },
        { property: "border-radius", value: `${s.radius}px` },
        { property: "animation", value: `skeleton-shimmer ${s.speed}s ease-in-out infinite` },
      ],
      surface: page,
      plainBackdrop: true,
      tailwindNote: "The shimmer also needs the @keyframes rule from the CSS tab in your stylesheet.",
      global: `@keyframes skeleton-shimmer {
  from {
    background-position: 100% 50%;
  }
  to {
    background-position: 0% 50%;
  }
}`,
      extra: (selector) =>
        [
          `@media (prefers-reduced-motion: reduce) {
  ${selector} {
    animation: none;
    background-image: none;
  }
}`,
          // Forced colors drop backgrounds, so outline the block to keep the placeholder visible.
          `@media (forced-colors: active) {
  ${selector} {
    outline: 1px solid GrayText;
  }
}`,
        ].join("\n\n"),
    };
  },
});
