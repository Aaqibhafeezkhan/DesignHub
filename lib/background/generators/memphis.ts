import { createRandom, pick, r1, range } from "@/lib/background/random";
import { wrapSvg } from "@/lib/background/svg";
import type { BackgroundDefinition } from "@/types/background";

type MemphisShape = "circle" | "triangle" | "squiggle" | "zigzag";
const shapes: MemphisShape[] = ["circle", "triangle", "squiggle", "zigzag"];

function shapeMarkup(
  shape: MemphisShape,
  x: number,
  y: number,
  size: number,
  angle: number,
  color: string,
): string {
  const transform = `translate(${r1(x)} ${r1(y)}) rotate(${angle})`;
  if (shape === "circle") {
    return `<circle transform="${transform}" r="${r1(size * 0.28)}" fill="${color}"/>`;
  }
  if (shape === "triangle") {
    return `<path transform="${transform}" d="M0 ${r1(-size * 0.36)}L${r1(size * 0.34)} ${r1(size * 0.28)}L${r1(-size * 0.34)} ${r1(size * 0.28)}Z" fill="${color}"/>`;
  }
  if (shape === "zigzag") {
    return `<path transform="${transform}" d="M${r1(-size * 0.42)} ${r1(-size * 0.15)}L${r1(-size * 0.14)} ${r1(size * 0.15)}L${r1(size * 0.14)} ${r1(-size * 0.15)}L${r1(size * 0.42)} ${r1(size * 0.15)}" fill="none" stroke="${color}" stroke-width="${r1(size * 0.12)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  return `<path transform="${transform}" d="M${r1(-size * 0.4)} 0C${r1(-size * 0.2)} ${r1(-size * 0.48)} ${r1(-size * 0.08)} ${r1(size * 0.48)} 0 0S${r1(size * 0.2)} ${r1(-size * 0.48)} ${r1(size * 0.4)} 0" fill="none" stroke="${color}" stroke-width="${r1(size * 0.11)}" stroke-linecap="round"/>`;
}

/** Seeded Memphis shapes placed on a jittered grid and grouped by shape type. */
export const memphis: BackgroundDefinition = {
  kind: "memphis",
  label: "Memphis",
  description: "A playful 80s Memphis pattern of scattered squiggles, triangles, circles and zigzags.",
  defaults: { density: 42, scale: 1, rotation: 0 },
  render(settings) {
    const { width, height, density, scale, seed } = settings;
    const random = createRandom(seed);
    const colors = settings.colors.length ? settings.colors : ["#888888"];
    const cell = Math.max(34, (104 - (density / 100) * 54) * scale);
    const columns = Math.max(1, Math.ceil(width / cell));
    const rows = Math.max(1, Math.ceil(height / cell));
    const cellWidth = width / columns;
    const cellHeight = height / rows;
    const sizeLimit = Math.min(cellWidth, cellHeight);
    const groups: Record<MemphisShape, string[]> = {
      circle: [],
      triangle: [],
      squiggle: [],
      zigzag: [],
    };

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const centerX = (column + 0.5) * cellWidth;
        const centerY = (row + 0.5) * cellHeight;
        const jitterX = range(random, -0.1, 0.1) * cellWidth;
        const jitterY = range(random, -0.1, 0.1) * cellHeight;
        const size = range(random, sizeLimit * 0.42, sizeLimit * 0.5);
        const angle = Math.round(random() * 360);
        const shape = pick(random, shapes);
        const color = pick(random, colors);
        groups[shape].push(
          shapeMarkup(
            shape,
            centerX + jitterX,
            centerY + jitterY,
            size,
            angle,
            color,
          ),
        );
      }
    }

    const body = shapes
      .map((shape) => `<g data-shape="${shape}">${groups[shape].join("")}</g>`)
      .join("");
    return wrapSvg(settings, body);
  },
};
