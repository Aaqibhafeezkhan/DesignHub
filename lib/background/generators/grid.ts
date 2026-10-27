import { cssRotationNote, spacingFor } from "@/lib/background/pattern";
import { createRandom, r1 } from "@/lib/background/random";
import { wrapSvg } from "@/lib/background/svg";
import type { BackgroundDefinition, BackgroundSettings } from "@/types/background";

const MAJOR_EVERY = 4;

function geometry(settings: BackgroundSettings) {
  const cell = r1(spacingFor(settings.density, settings.scale, 96, 16));
  const colors = settings.colors.length ? settings.colors : ["#ffffff"];
  return {
    cell,
    major: cell * MAJOR_EVERY,
    minorWidth: r1(Math.max(0.5, settings.scale * 0.75)),
    majorWidth: r1(Math.max(1, settings.scale * 1.5)),
    minor: colors[0]!,
    majorColor: colors[1] ?? colors[0]!,
    accent: colors[2] ?? colors[1] ?? colors[0]!,
  };
}

/** Graph-paper grid with major lines every four cells and a few seeded accent cells. */
export const grid: BackgroundDefinition = {
  kind: "grid",
  category: "patterns",
  label: "Grid",
  description: "Blueprint grid with major and minor lines.",
  defaults: { density: 55, scale: 1 },
  render(settings) {
    const g = geometry(settings);
    const { width, height } = settings;
    const random = createRandom(settings.seed);
    const columns = Math.ceil(width / g.cell);
    const rows = Math.ceil(height / g.cell);

    const accents = Array.from({ length: Math.round(3 + random() * 6) }, () => {
      const x = Math.floor(random() * columns) * g.cell;
      const y = Math.floor(random() * rows) * g.cell;
      return `<rect x="${r1(x)}" y="${r1(y)}" width="${g.cell}" height="${g.cell}" fill="${g.accent}" fill-opacity="0.35"/>`;
    }).join("");

    const defs = [
      `<pattern id="minor" width="${g.cell}" height="${g.cell}" patternUnits="userSpaceOnUse">`,
      `<path d="M${g.cell} 0H0V${g.cell}" fill="none" stroke="${g.minor}" stroke-opacity="0.35" stroke-width="${g.minorWidth}"/>`,
      "</pattern>",
      `<pattern id="major" width="${g.major}" height="${g.major}" patternUnits="userSpaceOnUse">`,
      `<rect width="${g.major}" height="${g.major}" fill="url(#minor)"/>`,
      `<path d="M${g.major} 0H0V${g.major}" fill="none" stroke="${g.majorColor}" stroke-opacity="0.7" stroke-width="${g.majorWidth}"/>`,
      "</pattern>",
    ].join("");

    return wrapSvg(settings, `${accents}<rect width="${width}" height="${height}" fill="url(#major)"/>`, defs);
  },
  css(settings) {
    const g = geometry(settings);
    const line = (color: string, size: number, direction: "to right" | "to bottom", opacity: number) =>
      `linear-gradient(${direction}, color-mix(in srgb, ${color} ${opacity}%, transparent) ${size}px, transparent ${size}px)`;
    return [
      `  background-color: ${settings.background};`,
      `  background-image:`,
      `    ${line(g.majorColor, g.majorWidth, "to right", 70)},`,
      `    ${line(g.majorColor, g.majorWidth, "to bottom", 70)},`,
      `    ${line(g.minor, g.minorWidth, "to right", 35)},`,
      `    ${line(g.minor, g.minorWidth, "to bottom", 35)};`,
      `  background-size: ${g.major}px ${g.major}px, ${g.major}px ${g.major}px, ${g.cell}px ${g.cell}px, ${g.cell}px ${g.cell}px;${cssRotationNote(settings)}`,
    ].join("\n");
  },
};
