import { createRandom, pick, r1, range } from "@/lib/background/random";
import { wrapSvg } from "@/lib/background/svg";
import type { BackgroundDefinition } from "@/types/background";

export type PackedCircle = { x: number; y: number; r: number };

/** The most circles and placement attempts for one canvas, however large, so rendering stays fast. */
export const maxPackedCircles = 420;
const maxPackingAttempts = 6000;

/**
 * Circles that never overlap (and keep `gap` px apart), by rejection sampling: big circles first,
 * then smaller ones into what is left. Attempts and circle count are both capped.
 */
export function packCircles(
  random: () => number,
  width: number,
  height: number,
  options: { count: number; maxRadius: number; minRadius: number; gap: number },
): PackedCircle[] {
  const placed: PackedCircle[] = [];
  const count = Math.min(options.count, maxPackedCircles);
  for (let attempt = 0; attempt < maxPackingAttempts && placed.length < count; attempt += 1) {
    // Radius shrinks as attempts go on, so large circles claim space before small ones fill gaps.
    const t = attempt / maxPackingAttempts;
    const r = options.minRadius + (options.maxRadius - options.minRadius) * (1 - t) ** 2 * random();
    const x = range(random, 0, width);
    const y = range(random, 0, height);
    if (placed.every((c) => Math.hypot(c.x - x, c.y - y) >= c.r + r + options.gap)) placed.push({ x, y, r });
  }
  return placed;
}

/** Many non-overlapping circles of varied size filling the canvas, in palette colors. */
export const circlePacking: BackgroundDefinition = {
  kind: "circle-packing",
  label: "Circle packing",
  description: "Non-overlapping circles of every size, packed edge to edge in your palette.",
  defaults: { density: 55, scale: 1 },
  render(settings) {
    const { width, height, density, scale, seed } = settings;
    const colors = settings.colors.length ? settings.colors : ["#888888"];
    const random = createRandom(seed + 509);
    const base = Math.min(width, height);
    const circles = packCircles(random, width, height, {
      count: Math.round(80 + (density / 100) * 340),
      maxRadius: base * 0.1 * scale,
      minRadius: Math.max(2, base * 0.006 * scale),
      gap: Math.max(1, base * 0.003),
    });
    const body = circles
      .map(
        (c) =>
          `<circle cx="${r1(c.x)}" cy="${r1(c.y)}" r="${r1(c.r)}" fill="${pick(random, colors)}" fill-opacity="${range(random, 0.6, 1).toFixed(2)}"/>`,
      )
      .join("");
    return wrapSvg(settings, body);
  },
};
