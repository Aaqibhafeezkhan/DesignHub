import { circlePacking } from "@/lib/background/generators/circle-packing";
import { isometric } from "@/lib/background/generators/isometric";
import { flowField } from "@/lib/background/generators/flow-field";
import { topographic } from "@/lib/background/generators/topographic";
import { voronoi } from "@/lib/background/generators/voronoi";
import type { BackgroundDefinition, BackgroundSettings } from "@/types/background";

/**
 * The generators that stall the page while a control moves. The worker bundles only these, not the whole
 * registry, and a test keeps the list equal to the generators marked `heavy`.
 */
export const heavyGenerators: BackgroundDefinition[] = [flowField, topographic, voronoi, circlePacking, isometric];

/** The same SVG the registry would write, for a heavy generator. */
export function renderHeavy(settings: BackgroundSettings): string {
  const generator = heavyGenerators.find((item) => item.kind === settings.kind);
  if (!generator) throw new Error(`${settings.kind} is not a heavy generator`);
  return generator.render(settings);
}
