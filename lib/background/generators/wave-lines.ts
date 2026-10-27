import { smoothPath, type Point } from "@/lib/background/path";
import { createRandom, r1, range } from "@/lib/background/random";
import { wrapSvg } from "@/lib/background/svg";
import type { BackgroundDefinition } from "@/types/background";

/** Caps so the largest density stays under about 200 kB. */
export const maxWaveLines = 40;
export const maxWaveLinePoints = 36;

function lineCount(density: number): number {
  return Math.round(6 + (Math.min(100, Math.max(0, density)) / 100) * (maxWaveLines - 6));
}

function pointCount(density: number): number {
  return Math.round(12 + (Math.min(100, Math.max(0, density)) / 100) * (maxWaveLinePoints - 12));
}

/** Parallel sine curves, each shifted in phase, like a stylized sound wave. */
export const waveLines: BackgroundDefinition = {
  kind: "wave-lines",
  category: "flows",
  label: "Wave lines",
  description: "Parallel sine curves, each shifted in phase, like a sound wave.",
  defaults: { density: 48, scale: 1.25 },
  render(settings) {
    const { width, height, density, scale, seed } = settings;
    const colors = settings.colors.length ? settings.colors : ["#ffffff"];
    const random = createRandom(seed);
    const lines = lineCount(density);
    const pointsPerLine = pointCount(density);
    const gap = height / (lines + 1);
    const amplitude = Math.min(gap * 0.85, range(random, 0.035, 0.11) * height * scale);
    const wavelength = width * range(random, 0.5, 1.25);
    const phase = random() * Math.PI * 2;
    const phaseStep = range(random, 0.4, 1.15);
    const harmonic = range(random, 0.18, 0.4);
    const stroke = r1(Math.min(4, Math.max(0.75, scale)));

    const body = Array.from({ length: lines }, (_, line) => {
      const baseline = gap * (line + 1);
      const linePhase = phase + line * phaseStep;
      const points: Point[] = Array.from({ length: pointsPerLine }, (_, index) => {
        const x = (index / (pointsPerLine - 1)) * width;
        const along = (x / wavelength) * Math.PI * 2 + linePhase;
        const y = baseline + Math.sin(along) * amplitude + Math.sin(along * 2 + phase) * amplitude * harmonic;
        return [x, y];
      });
      const color = colors[line % colors.length]!;
      return `<path d="${smoothPath(points)}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round"/>`;
    }).join("");

    return wrapSvg(settings, body);
  },
};
