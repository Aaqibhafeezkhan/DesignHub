import { getPaper } from "@/lib/background/paper";
import { smoothPath, type Point } from "@/lib/background/path";
import { createRandom, pick, range, r1 } from "@/lib/background/random";
import { wrapSvg } from "@/lib/background/svg";
import type { BackgroundDefinition } from "@/types/background";

function blobPoints(cx: number, cy: number, radius: number, random: () => number): Point[] {
  const count = Math.round(range(random, 5, 9));
  const offset = random() * Math.PI * 2;
  return Array.from({ length: count }, (_, i) => {
    const angle = offset + (i / count) * Math.PI * 2;
    const r = radius * range(random, 0.7, 1.25);
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
  });
}

/** Paper.js' "continuous" smoothing gives rounder, more organic curves than plain Catmull-Rom. */
function blobPath(points: Point[]): string {
  const paper = getPaper();
  if (!paper) return smoothPath(points, true);
  const path = new paper.Path({ segments: points, closed: true, insert: false });
  path.smooth({ type: "continuous" });
  // Paper emits 5 decimals; one is plenty at background scale and keeps exports small.
  const data = path.pathData.replace(/-?\d+\.\d+/g, (value) => String(r1(Number(value))));
  path.remove();
  return data;
}

export const blobs: BackgroundDefinition = {
  kind: "blobs",
  category: "flows",
  label: "Blobs",
  description: "Soft, organic shapes. Smoothed with Paper.js.",
  usesPaper: true,
  defaults: { density: 40, scale: 1 },
  render(settings) {
    const { width, height, density, scale, seed, colors } = settings;
    const random = createRandom(seed);
    const count = Math.round(3 + (density / 100) * 12);
    const base = Math.min(width, height) * 0.22 * scale;

    const shapes = Array.from({ length: count }, (_, index) => {
      const radius = base * range(random, 0.45, 1.3) * (index === 0 ? 1.4 : 1);
      const cx = range(random, -0.05, 1.05) * width;
      const cy = range(random, -0.05, 1.05) * height;
      const color = pick(random, colors.length ? colors : ["#6366f1"]);
      const opacity = r1(range(random, 0.55, 0.95));
      return `<path d="${blobPath(blobPoints(cx, cy, radius, random))}" fill="${color}" fill-opacity="${opacity}"/>`;
    });

    return wrapSvg(settings, shapes.join(""));
  },
};
