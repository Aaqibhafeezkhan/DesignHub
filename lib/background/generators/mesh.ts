import { createRandom, range, r1 } from "@/lib/background/random";
import { wrapSvg } from "@/lib/background/svg";
import type { BackgroundDefinition, BackgroundSettings } from "@/types/background";

type MeshPoint = { x: number; y: number; radius: number; color: string };

/** One set of seeded points drives both the SVG and the native CSS output. */
function meshPoints(settings: BackgroundSettings): MeshPoint[] {
  const random = createRandom(settings.seed);
  const count = Math.round(3 + (settings.density / 100) * 7);
  const colors = settings.colors.length ? settings.colors : ["#6366f1"];
  return Array.from({ length: count }, (_, index) => ({
    x: r1(range(random, 0, 100)),
    y: r1(range(random, 0, 100)),
    radius: r1(range(random, 35, 70) * settings.scale),
    color: colors[index % colors.length]!,
  }));
}

export const mesh: BackgroundDefinition = {
  kind: "mesh",
  category: "flows",
  label: "Mesh",
  description: "Soft color fields that blend into each other.",
  defaults: { density: 45, scale: 1 },
  render(settings) {
    const { width, height } = settings;
    const diagonal = Math.hypot(width, height);
    const points = meshPoints(settings);
    const defs = points
      .map(
        (point, index) =>
          `<radialGradient id="m${index}"><stop offset="0" stop-color="${point.color}"/><stop offset="1" stop-color="${point.color}" stop-opacity="0"/></radialGradient>`,
      )
      .join("");
    const body = points
      .map((point, index) => {
        const r = r1((point.radius / 100) * diagonal * 0.6);
        return `<circle cx="${r1((point.x / 100) * width)}" cy="${r1((point.y / 100) * height)}" r="${r}" fill="url(#m${index})"/>`;
      })
      .join("");
    return wrapSvg(settings, body, defs);
  },
  css(settings) {
    const layers = meshPoints(settings).map(
      (point) => `radial-gradient(at ${point.x}% ${point.y}%, ${point.color} 0px, transparent ${point.radius}%)`,
    );
    const rotate = settings.rotation
      ? `\n  /* Rotation is applied in the SVG export; CSS mesh layers are not rotated. */`
      : "";
    return `  background-color: ${settings.background};\n  background-image:\n    ${layers.join(",\n    ")};${rotate}`;
  },
};
