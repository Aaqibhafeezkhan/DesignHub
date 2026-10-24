import { colorRamp } from "@/lib/background/palette";
import { createRandom, r1, range } from "@/lib/background/random";
import { wrapSvg } from "@/lib/background/svg";
import type { BackgroundVariantDefinition } from "@/types/background";

/** Nested squares growing from a seeded center, alternating through the palette. */
export const squares: BackgroundVariantDefinition = {
  variant: "squares",
  label: "Squares",
  description: "Concentric squares from a seeded center, like rings but square.",
  defaults: { density: 45, scale: 1 },
  render(settings) {
    const { width, height, density, scale, seed } = settings;
    const random = createRandom(seed);
    const cx = range(random, 0.3, 0.7) * width;
    const cy = range(random, 0.3, 0.7) * height;
    const step = Math.max(12, (120 - (density / 100) * 90) * scale);
    // Enough squares for the largest to reach the farthest edge.
    const reach = Math.max(cx, width - cx, cy, height - cy);
    const count = Math.min(120, Math.ceil(reach / step) + 1);
    const palette = settings.colors.length ? colorRamp(settings.colors, settings.colors.length) : ["#888888"];
    // With one color, alternate it with the canvas so the rings still read.
    const fills = palette.length === 1 ? [palette[0] ?? "#888888", settings.background] : palette;
    const offset = Math.floor(random() * fills.length);
    // Largest first, so each smaller square paints over the one around it.
    const body = Array.from({ length: count }, (_, k) => {
      const i = count - 1 - k;
      const half = step * (i + 0.5);
      const size = r1(half * 2);
      return `<rect x="${r1(cx - half)}" y="${r1(cy - half)}" width="${size}" height="${size}" fill="${fills[(i + offset) % fills.length]}"/>`;
    }).join("");
    return wrapSvg(settings, body);
  },
};
