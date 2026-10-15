import type { Gradient } from "@/types/color";

export type EffectKind =
  | "glass"
  | "neumorphism"
  | "shadow"
  | "inset"
  | "glow"
  | "border"
  | "grain"
  | "long-shadow"
  | "gradient-text"
  | "skeleton"
  | "text-outline"
  | "focus-ring";

export type GlassSettings = {
  blur: number;
  saturation: number;
  tint: string;
  opacity: number;
  borderOpacity: number;
  shadowOpacity: number;
  radius: number;
};

export type NeumorphismShape = "flat" | "concave" | "convex" | "pressed";

export type NeumorphismSettings = {
  color: string;
  depth: number;
  blur: number;
  intensity: number;
  lightAngle: number;
  radius: number;
  shape: NeumorphismShape;
};

export type ShadowLayer = {
  id: string;
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  opacity: number;
  inset: boolean;
};

export type ShadowSettings = { layers: ShadowLayer[]; radius: number };

/** One inset shadow, for inputs, wells and pressed states. */
export type InsetSettings = {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  opacity: number;
  /** Background of the recessed element. */
  fill: string;
  radius: number;
};

export type GlowSettings = {
  color: string;
  radius: number;
  intensity: number;
  text: boolean;
  radiusCorner: number;
};

export type BorderSettings = {
  colors: string[];
  /** Inner fill painted over the gradient (padding-box). */
  fill: string;
  thickness: number;
  radius: number;
  angle: number;
  animated: boolean;
  speed: number;
};

export type BlendMode = "overlay" | "soft-light" | "multiply" | "screen" | "normal";

export type GrainSettings = {
  scale: number;
  opacity: number;
  frequency: number;
  blend: BlendMode;
};

export type LongShadowTarget = "box" | "text";

/** A flat-design shadow that runs out at an angle, built from stacked hard-edged steps. */
export type LongShadowSettings = {
  /** Direction the shadow runs, in degrees clockwise from the right (45 is down and to the right). */
  angle: number;
  /** In px. */
  length: number;
  color: string;
  /** 0 keeps the shadow solid, 1 fades it out completely by its far end. */
  fade: number;
  target: LongShadowTarget;
  /** Background of the box (box target only). */
  fill: string;
  radius: number;
};

/** Where gradient text takes its colors from: the Color Studio gradient, or stops set in the effect. */
export type GradientTextSource = "studio" | "custom";

/** Text filled with a gradient (background-clip: text). */
export type GradientTextSettings = {
  source: GradientTextSource;
  /** Gradient stops for the custom source. */
  colors: string[];
  /** Direction of the custom gradient, in degrees. */
  angle: number;
  /** Solid text color where gradient text isn't supported. null uses the gradient's first color. */
  fallback: string | null;
  /** Slowly shifts the gradient back and forth across the text. */
  animated: boolean;
  /** Seconds for one sweep across the text. */
  speed: number;
};

/** Where skeleton colors come from: tints of the brand's neutral color, or two colors set in the effect. */
export type SkeletonSource = "brand" | "custom";

/** Whether the placeholder sits on a light or a dark page (brand source only). */
export type SkeletonTone = "light" | "dark";

/** A loading placeholder: a muted block with a soft highlight sweeping across it. */
export type SkeletonSettings = {
  source: SkeletonSource;
  tone: SkeletonTone;
  /** Block color for the custom source. */
  base: string;
  /** Highlight color for the custom source. */
  highlight: string;
  /** Seconds for one sweep. */
  speed: number;
  /** Direction of the highlight band, in degrees. */
  angle: number;
  radius: number;
};

/** Outlined text (-webkit-text-stroke), with an optional hard shadow copy offset behind it. */
export type TextOutlineSettings = {
  /** Outline color. */
  color: string;
  /** Outline width in px. */
  width: number;
  /** Empty glyphs (only the outline shows). Off fills them with `fill`. */
  hollow: boolean;
  /** Glyph fill when not hollow. */
  fill: string;
  /** Adds a hard-edged copy of the outline offset behind the text. */
  shadow: boolean;
  shadowX: number;
  shadowY: number;
  shadowColor: string;
};

/** A two-tone :focus-visible ring (outline plus an inner gap ring) checked against a page and a component. */
export type FocusRingSettings = {
  /** Outer ring (the outline) color. This is the color the contrast check measures. */
  color: string;
  /** Inner ring color, painted in the gap between the component and the outer ring. */
  inner: string;
  /** Outer ring width in px. */
  width: number;
  /** Gap (and inner ring width) in px. */
  offset: number;
  /** The page behind the focused component, for the contrast check and the preview. */
  background: string;
  /** The focused component's own color (a button), for the contrast check. */
  component: string;
};

export type EffectSettingsMap = {
  glass: GlassSettings;
  neumorphism: NeumorphismSettings;
  shadow: ShadowSettings;
  inset: InsetSettings;
  glow: GlowSettings;
  border: BorderSettings;
  grain: GrainSettings;
  "long-shadow": LongShadowSettings;
  "gradient-text": GradientTextSettings;
  skeleton: SkeletonSettings;
  "text-outline": TextOutlineSettings;
  "focus-ring": FocusRingSettings;
};

/** State from other studios an effect may build on. Effects read it here instead of copying it into their settings. */
export type EffectContext = {
  /** The Color Studio gradient. */
  gradient: Gradient;
  /** Hex colors of the brand's neutral swatches (set or inferred roles), in palette order. */
  neutrals: string[];
};

/** A CSS property/value pair. Vendor-prefixed duplicates are allowed. */
export type CssDeclaration = { property: string; value: string };

/** Everything an effect produces. `extra` holds pseudo-elements, keyframes or @property rules. */
export type EffectCss = {
  declarations: CssDeclaration[];
  extra?: (selector: string) => string;
  /** Top-level at-rules (@property, @keyframes) that can't be nested inside a selector or utility. */
  global?: string;
  /** Some effects (animated borders, grain overlays) can't be expressed as Tailwind utilities alone. */
  tailwindNote?: string;
  /** The page color this effect is designed to sit on (e.g. neumorphism needs a matching surface). */
  surface?: string;
  /** Preview-only: the sample card's solid fill color (wins over `needsFill`). */
  fill?: string;
  /** Preview-only: give the sample card a solid fill (shadows and glows need something to cast from). */
  needsFill?: boolean;
  /** Preview-only: the effect paints its own gradient, so it is shown on the light or dark backdrop, not a busy one. */
  plainBackdrop?: boolean;
};

export type EffectBackdrop = "gradient" | "photo" | "light" | "dark";
