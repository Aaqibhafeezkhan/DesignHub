import { r1 } from "@/lib/background/random";
import { wrapSvg } from "@/lib/background/svg";
import { parseColor, toRgb } from "@/lib/color/color";
import type { BackgroundDefinition } from "@/types/background";

function rgb(hex: string): [number, number, number] {
  const color = parseColor(hex);
  if (!color) return [1, 1, 1];
  const { r, g, b } = toRgb(color);
  return [r / 255, g / 255, b / 255];
}

const fixed = (value: number) => Math.round(value * 1000) / 1000;

/**
 * Fractal noise (feTurbulence) per color. A color matrix paints each layer in its
 * color and turns noise luminance into alpha, so layers mottle into each other.
 */
export const noise: BackgroundDefinition = {
  kind: "noise",
  category: "textures",
  label: "Noise",
  description: "Grain and mottled texture from fractal noise.",
  defaults: { density: 55, scale: 1 },
  render(settings) {
    const { width, height, density, scale, seed, colors } = settings;
    // Exponential so the slider sweeps from large clouds (0) to fine film grain (100).
    const frequency = Math.max(0.001, fixed((0.005 * 180 ** (density / 100)) / scale));
    const contrast = 2.4;
    const palette = colors.length ? colors : ["#ffffff"];

    const defs = palette
      .map((color, index) => {
        const [r, g, b] = rgb(color);
        const k = fixed(contrast / 3);
        const offset = fixed(-(contrast - 1) / 2 - index * 0.08);
        return [
          `<filter id="noise${index}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">`,
          `<feTurbulence type="fractalNoise" baseFrequency="${frequency}" numOctaves="4" seed="${(seed + index * 97) % 100000}" stitchTiles="stitch"/>`,
          `<feColorMatrix type="matrix" values="0 0 0 0 ${fixed(r)} 0 0 0 0 ${fixed(g)} 0 0 0 0 ${fixed(b)} ${k} ${k} ${k} 0 ${offset}"/>`,
          "</filter>",
        ].join("");
      })
      .join("");

    const layers = palette
      .map(
        (_, index) =>
          `<rect width="${width}" height="${height}" filter="url(#noise${index})" opacity="${r1(0.9 - index * 0.12)}"/>`,
      )
      .join("");

    return wrapSvg(settings, layers, defs);
  },
};
