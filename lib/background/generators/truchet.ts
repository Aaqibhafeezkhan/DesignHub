import { patternSvg, spacingFor } from "@/lib/background/pattern";
import { createRandom, r1 } from "@/lib/background/random";
import type { BackgroundDefinition } from "@/types/background";

/**
 * One block of Truchet tiles as a single path `d` per color. Every tile holds two quarter circles
 * that join the midpoints of its edges, rotated by the seed, so the curves flow across tile
 * edges and the block repeats without a seam. Index `i` of the result belongs to color `i`.
 */
export function truchetPaths(random: () => number, size: number, cell: number, colors: number): string[] {
  const paths = Array.from({ length: Math.max(1, colors) }, () => "");
  const half = cell / 2;
  const arc = (color: number, x1: number, y1: number, x2: number, y2: number, sweep: 0 | 1) => {
    paths[color] += `M${r1(x1)} ${r1(y1)}A${r1(half)} ${r1(half)} 0 0 ${sweep} ${r1(x2)} ${r1(y2)}`;
  };
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const x = col * cell;
      const y = row * cell;
      const first = Math.floor(random() * paths.length);
      const second = Math.floor(random() * paths.length);
      if (random() < 0.5) {
        // Arcs around the top-left and bottom-right corners.
        arc(first, x + half, y, x, y + half, 1);
        arc(second, x + cell, y + half, x + half, y + cell, 0);
      } else {
        // Arcs around the top-right and bottom-left corners.
        arc(first, x + half, y, x + cell, y + half, 0);
        arc(second, x, y + half, x + half, y + cell, 1);
      }
    }
  }
  return paths;
}

/** A grid of quarter-circle tiles in palette colors, one path per color. */
export const truchet: BackgroundDefinition = {
  kind: "truchet",
  label: "Truchet",
  description: "Quarter-circle tiles rotated by the seed, joining into flowing curves.",
  defaults: { density: 50, scale: 1 },
  render(settings) {
    const cell = r1(spacingFor(settings.density, settings.scale, 120, 28));
    const colors = settings.colors.length ? settings.colors : ["#888888"];
    // A block of at least ~480px keeps the repeat hard to spot; the cap keeps the path data small.
    const size = Math.min(20, Math.max(8, Math.ceil(480 / cell)));
    const stroke = r1(Math.max(1, cell * 0.2));
    const paths = truchetPaths(createRandom(settings.seed + 211), size, cell, colors.length);
    const body = paths
      .map((d, i) =>
        d ? `<path d="${d}" fill="none" stroke="${colors[i]}" stroke-width="${stroke}" stroke-linecap="butt"/>` : "",
      )
      .join("");
    return patternSvg(settings, size * cell, size * cell, body);
  },
};
