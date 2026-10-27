import { defaultGradient } from "@/lib/color/gradient";
import type { EffectContext, EffectCss, EffectKind, EffectSettingsMap } from "@/types/effects";

/** Used where no studio state is at hand (tests, a fresh project): the Color Studio's default gradient. */
export const defaultEffectContext: EffectContext = { gradient: defaultGradient, neutrals: [] };

/** What an effect is for, so the picker can group them. */
export type EffectCategory = "surfaces" | "text" | "states" | "motion" | "images";

/** The categories in picker order. */
export const effectCategories: readonly EffectCategory[] = ["surfaces", "text", "states", "motion", "images"];

export type EffectDefinition<K extends EffectKind> = {
  kind: K;
  category: EffectCategory;
  label: string;
  description: string;
  /**
   * `context` carries state from other studios (the Color Studio gradient) that some effects build
   * on. Without it, effects use `defaultEffectContext`.
   */
  generate: (settings: EffectSettingsMap[K], context?: EffectContext) => EffectCss;
};

export type AnyEffectDefinition = { [K in EffectKind]: EffectDefinition<K> }[EffectKind];

export function defineEffect<K extends EffectKind>(definition: EffectDefinition<K>): EffectDefinition<K> {
  return definition;
}
