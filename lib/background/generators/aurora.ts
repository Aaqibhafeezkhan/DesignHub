import { smoothPath, type Point } from "@/lib/background/path";
import { createRandom, range, r1 } from "@/lib/background/random";
import { wrapSvg } from "@/lib/background/svg";
import type { BackgroundDefinition } from "@/types/background";

/** A ribbon: the top edge follows a wave, the bottom edge follows it back with varying thickness. */
function ribbon(width: number, height: number, random: () => number, scale: number): string {
  const steps = 8;
  const baseline = range(random, 0.18, 0.55) * height;
  const amplitude = range(random, 0.06, 0.18) * height * scale;
  const frequency = range(random, 0.6, 1.6);
  const phase = random() * Math.PI * 2;
  const top: Point[] = [];
  const bottom: Point[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const x = (i / steps) * width * 1.2 - width * 0.1;
    const y = baseline + Math.sin((i / steps) * Math.PI * 2 * frequency + phase) * amplitude;
    const thickness = height * range(random, 0.05, 0.22) * scale;
    top.push([x, y]);
    bottom.unshift([x, y + thickness]);
  }
  return smoothPath([...top, ...bottom], true, 0.8);
}

export const aurora: BackgroundDefinition = {
  kind: "aurora",
  category: "flows",
  label: "Aurora",
  description: "Blurred, glowing ribbons of light on a dark sky.",
  defaults: { density: 50, scale: 1, background: "#05060f" },
  render(settings) {
    const { width, height, density, scale, seed, colors } = settings;
    const random = createRandom(seed);
    const count = Math.round(2 + (density / 100) * 5);
    const palette = colors.length ? colors : ["#34d399"];
    const blur = r1(Math.min(width, height) * 0.05 * Math.max(0.5, scale));
    const defs = `<filter id="aurora-blur" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="${blur}"/></filter>`;

    const ribbons = Array.from({ length: count }, (_, index) => {
      const color = palette[index % palette.length]!;
      const opacity = r1(range(random, 0.45, 0.85));
      return `<path d="${ribbon(width, height, random, scale)}" fill="${color}" fill-opacity="${opacity}" style="mix-blend-mode:screen"/>`;
    }).join("");

    // A faint horizon glow grounds the scene.
    const glow = `<ellipse cx="${width / 2}" cy="${r1(height * 0.95)}" rx="${r1(width * 0.7)}" ry="${r1(height * 0.25)}" fill="${palette[0]}" fill-opacity="0.18"/>`;

    return wrapSvg(settings, `<g filter="url(#aurora-blur)">${ribbons}${glow}</g>`, defs);
  },
};
