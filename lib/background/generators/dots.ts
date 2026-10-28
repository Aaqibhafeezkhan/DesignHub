import { cssRotationNote, patternSvg, spacingFor } from "@/lib/background/pattern";
import { r1 } from "@/lib/background/random";
import type { BackgroundDefinition, BackgroundSettings } from "@/types/background";

function geometry(settings: BackgroundSettings) {
  const spacing = r1(spacingFor(settings.density, settings.scale, 64, 14));
  const radius = r1(Math.max(0.75, spacing * 0.12 * Math.sqrt(settings.scale)));
  const colors = settings.colors.length ? settings.colors : ["#ffffff"];
  return { spacing, radius, first: colors[0]!, second: colors[1] ?? colors[0]! };
}

/** Staggered (hex-like) dot grid; the second color fills the offset rows. */
export const dots: BackgroundDefinition = {
  kind: "dots",
  category: "patterns",
  label: "Dots",
  description: "Staggered dot grid, halftone style.",
  defaults: { density: 55, scale: 1 },
  render(settings) {
    const { spacing, radius, first, second } = geometry(settings);
    const tile = [
      `<circle cx="${r1(spacing / 2)}" cy="${r1(spacing / 2)}" r="${radius}" fill="${first}"/>`,
      `<circle cx="0" cy="${r1(spacing * 1.5)}" r="${radius}" fill="${second}"/>`,
      `<circle cx="${spacing}" cy="${r1(spacing * 1.5)}" r="${radius}" fill="${second}"/>`,
    ].join("");
    return patternSvg(settings, spacing, spacing * 2, tile);
  },
  css(settings) {
    const { spacing, radius, first, second } = geometry(settings);
    const dot = (color: string) => `radial-gradient(circle, ${color} ${radius}px, transparent ${r1(radius + 0.6)}px)`;
    return [
      `  background-color: ${settings.background};`,
      `  background-image: ${dot(first)}, ${dot(second)};`,
      `  background-size: ${spacing}px ${spacing * 2}px;`,
      `  background-position: 0 0, ${r1(spacing / 2)}px ${spacing}px;${cssRotationNote(settings)}`,
    ].join("\n");
  },
};
