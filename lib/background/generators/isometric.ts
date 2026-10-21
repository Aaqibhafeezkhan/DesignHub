import { spacingFor } from "@/lib/background/pattern";
import { createRandom, pick, r1 } from "@/lib/background/random";
import { wrapSvg } from "@/lib/background/svg";
import { oklch, parseColor, toHex } from "@/lib/color/color";
import type { BackgroundDefinition } from "@/types/background";

export type Faces = { top: string; left: string; right: string };

/** Top face catches the light, the right face falls into shadow. */
export function shade(hex: string): Faces {
  const color = parseColor(hex) ?? oklch(0.6, 0.1, 270);
  return {
    top: toHex(oklch(Math.min(0.97, color.l + 0.12), color.c * 0.9, color.h)),
    left: toHex(color),
    right: toHex(oklch(Math.max(0.05, color.l - 0.14), color.c, color.h)),
  };
}

export const isometric: BackgroundDefinition = {
  kind: "isometric",
  label: "Isometric",
  description: "Shaded isometric cubes with seeded gaps.",
  defaults: { density: 45, scale: 1 },
  render(settings) {
    const { width, height, density, scale, seed, colors } = settings;
    const random = createRandom(seed);
    const edge = spacingFor(density, scale, 64, 14) / 1.6;
    const hexWidth = edge * Math.sqrt(3);
    const rowStep = edge * 1.5;
    const palettes = (colors.length ? colors : ["#6366f1"]).map(shade);
    const fill = 0.55 + (density / 100) * 0.4;

    const cubes: string[] = [];
    for (let row = -1; row * rowStep < height + edge * 2; row += 1) {
      const offset = row % 2 === 0 ? 0 : hexWidth / 2;
      for (let x = -hexWidth + offset; x < width + hexWidth; x += hexWidth) {
        if (random() > fill) continue;
        const faces = pick(random, palettes);
        const cx = r1(x);
        const cy = r1(row * rowStep);
        const h = r1(hexWidth / 2);
        const e = r1(edge);
        const half = r1(edge / 2);
        cubes.push(
          `<path d="M${cx} ${r1(cy - e)}l${h} ${half}l${-h} ${half}l${-h} ${-half}z" fill="${faces.top}"/>`,
          `<path d="M${r1(cx - h)} ${r1(cy - half)}l${h} ${half}v${e}l${-h} ${-half}z" fill="${faces.left}"/>`,
          `<path d="M${r1(cx + h)} ${r1(cy - half)}l${-h} ${half}v${e}l${h} ${-half}z" fill="${faces.right}"/>`,
        );
      }
    }
    return wrapSvg(settings, cubes.join(""));
  },
};
