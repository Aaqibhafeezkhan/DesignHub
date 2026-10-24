import { bokeh } from "@/lib/background/generators/bokeh";
import { circuit } from "@/lib/background/generators/circuit";
import { confetti } from "@/lib/background/generators/confetti";
import { crosshatch } from "@/lib/background/generators/crosshatch";
import { halftone } from "@/lib/background/generators/halftone";
import { hexagons } from "@/lib/background/generators/hexagons";
import { lowPoly } from "@/lib/background/generators/low-poly";
import { plus } from "@/lib/background/generators/plus";
import { starfield } from "@/lib/background/generators/starfield";
import { stripes } from "@/lib/background/generators/stripes";
import { spirograph } from "@/lib/background/generators/spirograph";
import { sunburst } from "@/lib/background/generators/sunburst";
import { aurora } from "@/lib/background/generators/aurora";
import { blobs } from "@/lib/background/generators/blobs";
import { dots } from "@/lib/background/generators/dots";
import { grainGradient } from "@/lib/background/generators/grain-gradient";
import { grid } from "@/lib/background/generators/grid";
import { isometric } from "@/lib/background/generators/isometric";
import { mesh } from "@/lib/background/generators/mesh";
import { noise } from "@/lib/background/generators/noise";
import { triangles } from "@/lib/background/generators/triangles";
import { topographic } from "@/lib/background/generators/topographic";
import { voronoi } from "@/lib/background/generators/voronoi";
import { waves } from "@/lib/background/generators/waves";
import { waveLines } from "@/lib/background/generators/wave-lines";
import { truchet } from "@/lib/background/generators/truchet";
import { memphis } from "@/lib/background/generators/memphis";
import { flowField } from "@/lib/background/generators/flow-field";
import { circlePacking } from "@/lib/background/generators/circle-packing";
import { rhombus } from "@/lib/background/generators/rhombus";
import { concentric } from "@/lib/background/generators/concentric";
import { woven } from "@/lib/background/generators/woven";
import { zigzags } from "@/lib/background/generators/zigzags";
import { wrapSvg } from "@/lib/background/svg";
import type { BackgroundDefinition, BackgroundKind, BackgroundSettings } from "@/types/background";

/** Generators register themselves here as they are implemented. */
export const backgroundGenerators: BackgroundDefinition[] = [
  waves,
  waveLines,
  blobs,
  mesh,
  aurora,
  noise,
  dots,
  grid,
  isometric,
  lowPoly,
  bokeh,
  confetti,
  hexagons,
  sunburst,
  topographic,
  stripes,
  plus,
  starfield,
  voronoi,
  crosshatch,
  circuit,
  halftone,
  triangles,
  spirograph,
  truchet,
  memphis,
  flowField,
  circlePacking,
  rhombus,
  grainGradient,
  concentric,
  woven,
  zigzags,
];

export function getGenerator(kind: BackgroundKind): BackgroundDefinition | undefined {
  return backgroundGenerators.find((generator) => generator.kind === kind);
}

/** Complete SVG document for the current settings. */
export function renderBackgroundSvg(settings: BackgroundSettings): string {
  const generator = getGenerator(settings.kind);
  return generator ? generator.render(settings) : wrapSvg(settings, "");
}
