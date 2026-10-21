import { shade } from "@/lib/background/generators/isometric";
import { patternSvg, spacingFor } from "@/lib/background/pattern";
import { createRandom, pick, r1 } from "@/lib/background/random";
import type { BackgroundDefinition } from "@/types/background";

/** The repeating tile is this many cubes wide and tall, so the seed can vary the colors across it. */
const COLUMNS = 4;
/** Must be even: alternate rows are shifted by half a cube. */
const ROWS = 4;

export type RhombusFace = { points: [number, number][]; fill: string };

export type RhombusTile = { width: number; height: number; faces: RhombusFace[] };

/**
 * One repeating tile of "tumbling blocks": pointy-top hexagons of circumradius `radius`, each split into
 * a top, left and right rhombus in three tones of one palette color. Cubes that cross the tile edge
 * are also drawn on the opposite side, so the tile repeats without a seam.
 */
export function rhombusTile(radius: number, colors: string[], seed: number): RhombusTile {
  const random = createRandom(seed);
  const palettes = (colors.length ? colors : ["#6366f1"]).map(shade);
  const cell = r1(Math.sqrt(3) * radius);
  const half = cell / 2;
  const width = r1(cell * COLUMNS);
  const height = r1(radius * 1.5 * ROWS);

  const faces: RhombusFace[] = [];
  for (let row = 0; row < ROWS; row += 1) {
    for (let column = 0; column < COLUMNS; column += 1) {
      const tones = pick(random, palettes);
      const cx = half + column * cell + (row % 2 ? half : 0);
      const cy = radius + row * radius * 1.5;
      const top: [number, number] = [cx, cy - radius];
      const upperLeft: [number, number] = [cx - half, cy - radius / 2];
      const upperRight: [number, number] = [cx + half, cy - radius / 2];
      const lowerLeft: [number, number] = [cx - half, cy + radius / 2];
      const lowerRight: [number, number] = [cx + half, cy + radius / 2];
      const bottom: [number, number] = [cx, cy + radius];
      const centre: [number, number] = [cx, cy];
      const cube: RhombusFace[] = [
        { points: [centre, upperLeft, top, upperRight], fill: tones.top },
        { points: [centre, upperLeft, lowerLeft, bottom], fill: tones.left },
        { points: [centre, upperRight, lowerRight, bottom], fill: tones.right },
      ];
      for (const dx of [-width, 0, width]) {
        for (const dy of [-height, 0, height]) {
          const moved = { x: cx - half + dx, y: cy - radius + dy };
          // Keep a copy only if the cube's bounding box touches the tile.
          if (moved.x >= width || moved.x + cell <= 0 || moved.y >= height || moved.y + radius * 2 <= 0) continue;
          for (const face of cube) {
            faces.push({ points: face.points.map(([x, y]) => [r1(x + dx), r1(y + dy)]), fill: face.fill });
          }
        }
      }
    }
  }
  return { width, height, faces };
}

export const rhombus: BackgroundDefinition = {
  kind: "rhombus",
  label: "Rhombus",
  description: "Tumbling blocks: a seamless tessellation of diamonds in three tones.",
  defaults: { density: 45, scale: 1 },
  render(settings) {
    const radius = r1(spacingFor(settings.density, settings.scale, 80, 14) / 1.5);
    const tile = rhombusTile(radius, settings.colors, settings.seed);
    // A hairline of the face's own color hides the anti-aliasing gap between neighbouring diamonds.
    const stroke = r1(Math.max(0.4, radius * 0.02));
    const body = tile.faces
      .map(
        (face) =>
          `<path d="M${face.points.map(([x, y]) => `${x} ${y}`).join("L")}Z" fill="${face.fill}" stroke="${face.fill}" stroke-width="${stroke}" stroke-linejoin="round"/>`,
      )
      .join("");
    return patternSvg(settings, tile.width, tile.height, body);
  },
};
