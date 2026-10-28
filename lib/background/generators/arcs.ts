import { createRandom, r1, range } from "@/lib/background/random";
import { wrapSvg } from "@/lib/background/svg";
import type { BackgroundVariantDefinition, BackgroundSettings } from "@/types/background";

/** Hard cap so a huge canvas cannot emit hundreds of paths. */
export const maxConcentricArcs = 48;

type ConcentricArc = { radius: number; color: string };

export type ConcentricArcLayout = {
  cx: number;
  cy: number;
  /** Radians, from the positive x axis, clockwise in SVG. */
  start: number;
  /** Radians. Kept below a full turn so each ring stays an arc. */
  sweep: number;
  stroke: number;
  arcs: ConcentricArc[];
};

type ArcInput = Pick<BackgroundSettings, "width" | "height" | "density" | "scale" | "seed" | "colors">;

/** Nested partial rings. Density sets how many fit; scale sets their spacing. */
export function concentricArcLayout(settings: ArcInput): ConcentricArcLayout {
  const random = createRandom(settings.seed);
  const cx = r1(range(random, 0.12, 0.88) * settings.width);
  const cy = r1(range(random, 0.12, 0.88) * settings.height);
  const start = range(random, 0, Math.PI * 2);
  // About 108 to 306 degrees: wide enough to read, never a closed ring.
  const sweep = range(random, Math.PI * 0.6, Math.PI * 1.7);
  const step = Math.max(18, (120 - (settings.density / 100) * 92) * settings.scale);
  const reach = Math.hypot(settings.width, settings.height);
  const count = Math.min(maxConcentricArcs, Math.max(4, Math.ceil(reach / step)));
  const palette = settings.colors.length > 0 ? settings.colors : ["#888888"];
  const offset = Math.floor(random() * palette.length);
  const stroke = r1(Math.min(step * 0.45, Math.max(2, step - 4)));
  return {
    cx,
    cy,
    start,
    sweep,
    stroke,
    arcs: Array.from({ length: count }, (_, index) => ({
      radius: r1(step * (index + 1)),
      color: palette[(index + offset) % palette.length] ?? "#888888",
    })),
  };
}

function arcPath(cx: number, cy: number, radius: number, start: number, sweep: number): string {
  const end = start + sweep;
  const x0 = r1(cx + Math.cos(start) * radius);
  const y0 = r1(cy + Math.sin(start) * radius);
  const x1 = r1(cx + Math.cos(end) * radius);
  const y1 = r1(cy + Math.sin(end) * radius);
  const large = sweep > Math.PI ? 1 : 0;
  return `M${x0} ${y0}A${r1(radius)} ${r1(radius)} 0 ${large} 1 ${x1} ${y1}`;
}

/** Concentric arcs sharing one seeded center, open so they are not rings. */
export const arcs: BackgroundVariantDefinition = {
  variant: "arcs",
  label: "Arcs",
  description: "Concentric arcs from a seeded center, open instead of closed rings.",
  defaults: { density: 45, scale: 1 },
  render(settings) {
    const layout = concentricArcLayout(settings);
    const paths = layout.arcs
      .map(
        (arc) =>
          `<path d="${arcPath(layout.cx, layout.cy, arc.radius, layout.start, layout.sweep)}" stroke="${arc.color}"/>`,
      )
      .join("");
    return wrapSvg(settings, `<g fill="none" stroke-linecap="round" stroke-width="${layout.stroke}">${paths}</g>`);
  },
};
