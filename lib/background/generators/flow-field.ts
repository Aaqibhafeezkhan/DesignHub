import { createRandom, r1, range } from "@/lib/background/random";
import { wrapSvg } from "@/lib/background/svg";
import type { BackgroundDefinition } from "@/types/background";

/** Points per path and paths per canvas never exceed these, so the SVG stays small. */
export const maxFlowPathPoints = 36;
export const maxFlowPaths = 360;

const quintic = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

/** Integer hash of a lattice node and the seed, mapped to 0-1. */
function lattice(seed: number, x: number, y: number): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Seeded 2D value noise in 0-1, in plain TypeScript. */
export function valueNoise(seed: number, x: number, y: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const sx = quintic(x - x0);
  const sy = quintic(y - y0);
  const top = lattice(seed, x0, y0) + (lattice(seed, x0 + 1, y0) - lattice(seed, x0, y0)) * sx;
  const bottom = lattice(seed, x0, y0 + 1) + (lattice(seed, x0 + 1, y0 + 1) - lattice(seed, x0, y0 + 1)) * sx;
  return top + (bottom - top) * sy;
}

/** The field's flow angle at a point: two octaves of noise stretched over two full turns. */
export function flowAngle(seed: number, x: number, y: number, frequency: number): number {
  const n =
    valueNoise(seed, x * frequency, y * frequency) * 0.75 +
    valueNoise(seed + 7, x * frequency * 2.3, y * frequency * 2.3) * 0.25;
  return n * Math.PI * 4;
}

/** Thin curves that follow a seeded noise-driven angle field, one path per palette color. */
export const flowField: BackgroundDefinition = {
  kind: "flow-field",
  label: "Flow field",
  description: "Many thin curves that follow a seeded noise field, like wind-swept lines.",
  defaults: { density: 55, scale: 1 },
  render(settings) {
    const { width, height, seed } = settings;
    const colors = settings.colors.length ? settings.colors : ["#888888"];
    const random = createRandom(seed + 211);
    const area = width * height;
    const count = Math.min(maxFlowPaths, Math.round(60 + (settings.density / 100) * 300));
    const step = Math.max(4, (Math.sqrt(area) / 90) * settings.scale);
    const frequency = 2.4 / Math.max(width, height) / settings.scale;
    const stroke = r1(Math.max(0.6, Math.sqrt(area) / 1400));
    const strokes = colors.map(() => [] as string[]);

    for (let i = 0; i < count; i += 1) {
      let x = range(random, -step, width + step);
      let y = range(random, -step, height + step);
      const points = Math.round(range(random, 14, maxFlowPathPoints));
      let d = `M${r1(x)} ${r1(y)}`;
      for (let p = 1; p < points; p += 1) {
        const angle = flowAngle(seed, x, y, frequency);
        x += Math.cos(angle) * step;
        y += Math.sin(angle) * step;
        d += `L${r1(x)} ${r1(y)}`;
      }
      strokes[i % colors.length]!.push(d);
    }

    const body = strokes
      .map((paths, index) =>
        paths.length
          ? `<path d="${paths.join("")}" fill="none" stroke="${colors[index]}" stroke-width="${stroke}" stroke-opacity="${r1(0.9 - (index % 3) * 0.12)}" stroke-linecap="round" stroke-linejoin="round"/>`
          : "",
      )
      .join("");
    return wrapSvg(settings, body);
  },
};
