import { effectStylesheet } from "@/lib/effects/css";
import { defaultEffectContext } from "@/lib/effects/define";
import { effectDefinitions, generateEffect } from "@/lib/effects/registry";
import type { EffectContext, EffectSettingsMap } from "@/types/effects";

export type MotionRow = {
  /** The effect's name in the Effects Lab. */
  check: string;
  /** What moves in its exported CSS. */
  motion: string;
  /** Whether the exported CSS has an `@media (prefers-reduced-motion` rule. */
  reducedMotionRule: boolean;
  pass: boolean;
};

export type MotionSection = {
  criterion: string;
  note: string;
  /** True when every animated effect has a reduced-motion rule (and when none animates). */
  pass: boolean;
  /** One row per effect that moves with the current Effects Lab settings. */
  checks: MotionRow[];
};

/** A keyframe animation, or a transition that runs a transform. Colors fading in place don't count. */
const ANIMATION = /(^|[\s;{])animation(-name)?\s*:|@keyframes\s/m;
const TRANSFORM_TRANSITION = /(^|[\s;{])transition\s*:[^;]*\btransform\b/m;

/** What moves in a stylesheet, read from its text and never guessed from the effect's name. */
export function motionIn(css: string): string | null {
  const animation = ANIMATION.test(css);
  const transition = TRANSFORM_TRANSITION.test(css);
  if (animation && transition) return "Animation and transform transition";
  if (animation) return "Animation";
  if (transition) return "Transform transition";
  return null;
}

/** Whether the stylesheet adapts to `prefers-reduced-motion`, with either `reduce` or `no-preference`. */
export function hasReducedMotionRule(css: string): boolean {
  return /@media[^{]*\(\s*prefers-reduced-motion\b/i.test(css);
}

/** The row for one effect's exported CSS, or null when nothing in it moves. */
export function motionRow(label: string, css: string): MotionRow | null {
  const motion = motionIn(css);
  if (!motion) return null;
  const reducedMotionRule = hasReducedMotionRule(css);
  return { check: label, motion, reducedMotionRule, pass: reducedMotionRule };
}

/**
 * The report section: every effect whose exported CSS animates or moves, with whether that CSS carries
 * a reduced-motion rule. It reads the real output of each effect for the Effects Lab's current settings,
 * so turning an animation on in the Effects Lab shows up here.
 */
export function motionSection(
  settings: EffectSettingsMap,
  context: EffectContext = defaultEffectContext,
): MotionSection {
  const checks = effectDefinitions.flatMap((definition) => {
    const effect = generateEffect(definition.kind, settings[definition.kind], context);
    const row = effect ? motionRow(definition.label, effectStylesheet(effect, `.fx-${definition.kind}`)) : null;
    return row ? [row] : [];
  });
  return {
    criterion: "Reduced motion (prefers-reduced-motion)",
    note: "An effect that animates or moves in its exported CSS needs an @media (prefers-reduced-motion rule, so people who ask for less motion don't get it. Effects that don't move with the current Effects Lab settings aren't listed.",
    pass: checks.every((row) => row.pass),
    checks,
  };
}
