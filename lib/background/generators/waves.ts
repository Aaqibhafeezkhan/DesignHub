import { colorRamp } from "@/lib/background/palette";
import { smoothPath, type Point } from "@/lib/background/path";
import { createRandom, range } from "@/lib/background/random";
import { wrapSvg } from "@/lib/background/svg";
import type { BackgroundDefinition } from "@/types/background";

/** Stacked, layered waves - the classic landing-page footer, but seeded. */
export const waves: BackgroundDefinition = {
  kind: "waves",
  category: "flows",
  label: "Waves",
  description: "Layered, flowing wave bands.",
  defaults: { density: 45, scale: 1 },
  render(settings) {
    const { width, height, density, scale, seed } = settings;
    const random = createRandom(seed);
    const layers = Math.round(2 + (density / 100) * 8);
    const colors = colorRamp(settings.colors, layers);
    const top = height * 0.18;
    const band = (height - top) / layers;

    const paths = colors.map((color, layer) => {
      const baseline = top + band * (layer + 0.5);
      const amplitude = band * range(random, 0.8, 1.8) * scale;
      const wavelength = width * range(random, 0.35, 0.8) * scale;
      const phase = random() * Math.PI * 2;
      const steps = Math.max(6, Math.ceil(width / (wavelength / 4)));
      const points: Point[] = Array.from({ length: steps + 1 }, (_, i) => {
        const x = (i / steps) * width;
        const wobble =
          Math.sin((x / wavelength) * Math.PI * 2 + phase) +
          0.35 * Math.sin((x / wavelength) * Math.PI * 5 + phase * 2);
        return [x, baseline + wobble * amplitude * 0.5];
      });
      const d = `${smoothPath(points)}L${width} ${height}L0 ${height}Z`;
      const opacity = (0.75 + (layer / layers) * 0.25).toFixed(2);
      return `<path d="${d}" fill="${color}" fill-opacity="${opacity}"/>`;
    });

    return wrapSvg(settings, paths.join(""));
  },
};
