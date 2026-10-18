import type { ComponentType } from "react";

import { BorderControls } from "@/components/effects/border-controls";
import { FocusRingControls } from "@/components/effects/focus-ring-controls";
import { GlassControls } from "@/components/effects/glass-controls";
import { HighlighterControls } from "@/components/effects/highlighter-controls";
import { GlowControls } from "@/components/effects/glow-controls";
import { GradientTextControls } from "@/components/effects/gradient-text-controls";
import { GrainControls } from "@/components/effects/grain-controls";
import { InsetControls } from "@/components/effects/inset-controls";
import { LongShadowControls } from "@/components/effects/long-shadow-controls";
import { NeumorphismControls } from "@/components/effects/neumorphism-controls";
import { ShadowControls } from "@/components/effects/shadow-controls";
import { SkeletonControls } from "@/components/effects/skeleton-controls";
import { TextOutlineControls } from "@/components/effects/text-outline-controls";
import type { EffectKind } from "@/types/effects";

/** Control panels per effect; each effect adds its own entry. */
export const effectControls: Partial<Record<EffectKind, ComponentType>> = {
  glass: GlassControls,
  neumorphism: NeumorphismControls,
  shadow: ShadowControls,
  inset: InsetControls,
  glow: GlowControls,
  border: BorderControls,
  grain: GrainControls,
  "long-shadow": LongShadowControls,
  "gradient-text": GradientTextControls,
  skeleton: SkeletonControls,
  "text-outline": TextOutlineControls,
  "focus-ring": FocusRingControls,
  highlighter: HighlighterControls,
};
