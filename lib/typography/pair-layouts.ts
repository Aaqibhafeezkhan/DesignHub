import type { TypeScaleStep } from "@/types/typography";

/** The realistic layouts a font pair can be judged in. */
export const pairLayouts = ["article", "pricing", "hero"] as const;
export type PairLayout = (typeof pairLayouts)[number];

export function isPairLayout(value: string): value is PairLayout {
  return (pairLayouts as readonly string[]).includes(value);
}

/**
 * The CSS size for a step of the brand's live type scale: its fluid `clamp()`, or `fallback`
 * when the scale doesn't have that step (a short scale has no "5xl").
 */
export function scaleSize(scale: TypeScaleStep[], name: string, fallback: string): string {
  return scale.find((step) => step.name === name)?.clamp ?? fallback;
}
