import { patternSvg, spacingFor } from "@/lib/background/pattern";
import { createRandom, pick, r1, range } from "@/lib/background/random";
import type { BackgroundDefinition } from "@/types/background";

/** Fixed gear (R) and rolling gear (r) tooth counts that make pretty, closed curves. */
const gears = [
  [5, 3],
  [7, 3],
  [7, 4],
  [8, 3],
  [9, 4],
  [9, 5],
  [11, 4],
  [11, 6],
  [12, 5],
  [13, 6],
] as const;

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/** Points per curve never exceed this, however many lobes the gear ratio makes. */
export const maxSpirographPoints = 260;

/**
 * One closed hypotrochoid fitted into `radius`: the pen sits `pen` (0-1.2) of the rolling gear's
 * radius from its center. The curve closes after r / gcd(R, r) turns of the fixed gear.
 */
export function hypotrochoid(
  cx: number,
  cy: number,
  radius: number,
  [fixed, rolling]: readonly [number, number],
  pen: number,
  phase: number,
): string {
  const turns = rolling / gcd(fixed, rolling);
  const offset = pen * rolling;
  const reach = fixed - rolling + offset;
  const k = (fixed - rolling) / rolling;
  const count = Math.min(maxSpirographPoints, Math.max(120, turns * 72));
  const points: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const t = (i / count) * turns * Math.PI * 2;
    const x = (fixed - rolling) * Math.cos(t) + offset * Math.cos(k * t);
    const y = (fixed - rolling) * Math.sin(t) - offset * Math.sin(k * t);
    const cos = Math.cos(phase);
    const sin = Math.sin(phase);
    const scale = radius / reach;
    points.push(`${r1(cx + (x * cos - y * sin) * scale)} ${r1(cy + (x * sin + y * cos) * scale)}`);
  }
  return `M${points.join("L")}Z`;
}

/** Thin overlapping hypotrochoids in palette colors, a few per tile with seeded gear ratios. */
export const spirograph: BackgroundDefinition = {
  kind: "spirograph",
  label: "Spirograph",
  description: "Thin, overlapping hypotrochoid curves with seeded gear ratios and phases.",
  defaults: { density: 35, scale: 1 },
  render(settings) {
    const cell = r1(spacingFor(settings.density, settings.scale, 420, 150));
    const colors = settings.colors.length ? settings.colors : ["#888888"];
    const stroke = r1(Math.max(0.5, cell * 0.004 + 0.4));
    const random = createRandom(settings.seed + 101);
    const layers = settings.density > 66 ? 3 : 2;
    // A 2 x 2 tile with a different spirograph in each cell, so the repeat is hard to spot.
    const curves: string[] = [];
    let color = 0;
    for (let row = 0; row < 2; row += 1) {
      for (let col = 0; col < 2; col += 1) {
        const cx = (col + 0.5) * cell;
        const cy = (row + 0.5) * cell;
        for (let layer = 0; layer < layers; layer += 1) {
          const ratio = pick(random, gears);
          const radius = cell * 0.48 * (1 - layer * range(random, 0.14, 0.24));
          const d = hypotrochoid(cx, cy, radius, ratio, range(random, 0.35, 1.1), random() * Math.PI * 2);
          curves.push(
            `<path d="${d}" fill="none" stroke="${colors[color % colors.length]}" stroke-width="${stroke}" stroke-opacity="${r1(range(random, 0.55, 0.95))}" stroke-linejoin="round"/>`,
          );
          color += 1;
        }
      }
    }
    return patternSvg(settings, cell * 2, cell * 2, curves.join(""));
  },
};
