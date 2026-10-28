export type BackgroundKind =
  | "waves"
  | "wave-lines"
  | "blobs"
  | "mesh"
  | "aurora"
  | "noise"
  | "dots"
  | "grid"
  | "isometric"
  | "low-poly"
  | "bokeh"
  | "confetti"
  | "hexagons"
  | "sunburst"
  | "topographic"
  | "stripes"
  | "plus"
  | "starfield"
  | "voronoi"
  | "crosshatch"
  | "circuit"
  | "halftone"
  | "triangles"
  | "zigzag"
  | "spirograph"
  | "truchet"
  | "memphis"
  | "flow-field"
  | "circle-packing"
  | "rhombus"
  | "grain-gradient"
  | "concentric"
  | "woven";

/** Halftone gradient shape: forced linear or radial, or picked by the seed. */
export type HalftoneGradientChoice = "seeded" | "linear" | "radial";

/**
 * Settings that only one generator reads. Every field is optional, so other generators and
 * backgrounds saved before a field existed keep working.
 */
export type BackgroundOptions = {
  /** Halftone only. Missing means "seeded". */
  halftoneGradient?: HalftoneGradientChoice;
  /** Generators with variants only (concentric, woven, zigzag). Missing means the generator's first variant. */
  variant?: BackgroundVariant;
};

/** The looks that were separate generators before they were merged into concentric, woven and zigzag. */
export type BackgroundVariant =
  "rings" | "arcs" | "squares" | "argyle" | "plaid" | "checks" | "zigzag" | "chevron" | "squiggle";

export type BackgroundSettings = {
  kind: BackgroundKind;
  seed: number;
  /** Foreground colors (hex), in order of prominence. */
  colors: string[];
  /** Canvas color (hex). */
  background: string;
  /** 0–100. What "density" means is up to each generator (layers, points, spacing…). */
  density: number;
  /** 0.25–4. Multiplies the size of the pattern features. */
  scale: number;
  /** Degrees, 0–360. */
  rotation: number;
  width: number;
  height: number;
  /** Generator-specific settings. Optional, so older saved backgrounds still load. */
  options?: BackgroundOptions;
};

/** One look inside a generator that has several: the drawing and the native CSS, when it has any. */
export type BackgroundVariantDefinition = {
  variant: BackgroundVariant;
  label: string;
  description: string;
  render: (settings: BackgroundSettings) => string;
  css?: (settings: BackgroundSettings) => string;
  /** Preferred starting values when the person switches to this variant. */
  defaults?: Partial<Omit<BackgroundSettings, "kind" | "seed" | "width" | "height" | "options">>;
};

/** What a generator draws, so the picker can group the generators. */
export type BackgroundCategory = "flows" | "patterns" | "shapes" | "textures" | "maps";

export type BackgroundDefinition = {
  category: BackgroundCategory;
  /** The looks of a generator that has several, in picker order. The first is the default. */
  variants?: BackgroundVariantDefinition[];
  kind: BackgroundKind;
  label: string;
  description: string;
  /** Returns the drawing (without the outer <svg>) in a width × height coordinate space. */
  render: (settings: BackgroundSettings) => string;
  /** Native CSS when the pattern can be expressed without an image. */
  css?: (settings: BackgroundSettings) => string;
  /** Needs Paper.js (loaded lazily); renders with a built-in fallback until it's ready. */
  usesPaper?: boolean;
  /** Does enough work to stall the page while a control moves, so the studio draws it in a worker. */
  heavy?: boolean;
  /** Preferred starting values when the user switches to this generator. */
  defaults?: Partial<Omit<BackgroundSettings, "kind" | "seed" | "width" | "height" | "options">>;
};
