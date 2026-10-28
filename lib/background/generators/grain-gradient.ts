import { createRandom, r1 } from "@/lib/background/random";
import { wrapSvg } from "@/lib/background/svg";
import type { BackgroundDefinition, BackgroundSettings } from "@/types/background";

/** Few stops keep the SVG small and the gradient smooth. */
export const maxGrainStops = 5;

/** The seed picks the angle and shuffles the stop order, so every seed is a different blend. */
export function grainGradientLayout(settings: BackgroundSettings): { angle: number; stops: string[] } {
  const random = createRandom(settings.seed);
  const palette = settings.colors.slice(0, maxGrainStops);
  const stops = palette.length >= 2 ? [...palette] : [...palette, settings.background];
  for (let index = stops.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [stops[index], stops[other]] = [stops[other]!, stops[index]!];
  }
  return { angle: Math.floor(random() * 360), stops };
}

/** Fractal noise as a gray layer, blended over the gradient. Density sets how strong, scale how coarse. */
export const grainGradient: BackgroundDefinition = {
  kind: "grain-gradient",
  category: "textures",
  label: "Grainy gradient",
  description: "A smooth multi-stop gradient with a fine noise layer on top.",
  defaults: { density: 60, scale: 1 },
  render(settings) {
    const { width, height, density, scale, seed } = settings;
    const { angle, stops } = grainGradientLayout(settings);
    const radians = (angle * Math.PI) / 180;
    // A line through the center, long enough that its ends reach the corners.
    const half = (Math.abs(width * Math.sin(radians)) + Math.abs(height * Math.cos(radians))) / 2;
    const dx = Math.sin(radians) * half;
    const dy = -Math.cos(radians) * half;
    const cx = width / 2;
    const cy = height / 2;
    const frequency = Math.max(0.05, Math.round((0.9 / scale) * 1000) / 1000);
    const strength = r1(0.15 + (density / 100) * 0.65);

    const offsetOf = (index: number) => (stops.length === 1 ? 0 : r1((index / (stops.length - 1)) * 100));
    const defs = [
      `<linearGradient id="grain-fill" gradientUnits="userSpaceOnUse" x1="${r1(cx - dx)}" y1="${r1(cy - dy)}" x2="${r1(cx + dx)}" y2="${r1(cy + dy)}">`,
      stops.map((color, index) => `<stop offset="${offsetOf(index)}%" stop-color="${color}"/>`).join(""),
      "</linearGradient>",
      `<filter id="grain-noise" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">`,
      `<feTurbulence type="fractalNoise" baseFrequency="${frequency}" numOctaves="3" seed="${seed % 100000}" stitchTiles="stitch"/>`,
      `<feColorMatrix type="saturate" values="0"/>`,
      "</filter>",
    ].join("");
    const body = [
      `<rect width="${width}" height="${height}" fill="url(#grain-fill)"/>`,
      `<rect width="${width}" height="${height}" filter="url(#grain-noise)" opacity="${strength}" style="mix-blend-mode:overlay"/>`,
    ].join("");
    return wrapSvg(settings, body, defs);
  },
};
