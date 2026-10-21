import { border } from "@/lib/effects/border";
import { defaultEffectContext, type AnyEffectDefinition, type EffectDefinition } from "@/lib/effects/define";
import { focusRing } from "@/lib/effects/focus-ring";
import { glass } from "@/lib/effects/glass";
import { highlighter } from "@/lib/effects/highlighter";
import { gradientText } from "@/lib/effects/gradient-text";
import { glow } from "@/lib/effects/glow";
import { grain } from "@/lib/effects/grain";
import { inset } from "@/lib/effects/inset";
import { longShadow } from "@/lib/effects/long-shadow";
import { neumorphism } from "@/lib/effects/neumorphism";
import { scrollbar } from "@/lib/effects/scrollbar";
import { selection } from "@/lib/effects/selection";
import { shadow } from "@/lib/effects/shadow";
import { skeleton } from "@/lib/effects/skeleton";
import { textOutline } from "@/lib/effects/text-outline";
import type { EffectContext, EffectCss, EffectKind, EffectSettingsMap } from "@/types/effects";

/** Effects register here as they are implemented. */
export const effectDefinitions: AnyEffectDefinition[] = [
  glass,
  neumorphism,
  shadow,
  inset,
  glow,
  border,
  grain,
  longShadow,
  gradientText,
  skeleton,
  textOutline,
  focusRing,
  highlighter,
  scrollbar,
  selection,
];

export function generateEffect<K extends EffectKind>(
  kind: K,
  settings: EffectSettingsMap[K],
  context: EffectContext = defaultEffectContext,
): EffectCss | null {
  const definition = effectDefinitions.find((item) => item.kind === kind) as EffectDefinition<K> | undefined;
  return definition ? definition.generate(settings, context) : null;
}
