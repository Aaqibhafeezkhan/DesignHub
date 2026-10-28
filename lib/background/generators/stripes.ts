import { spacingFor } from "@/lib/background/pattern";
import { createRandom, r1 } from "@/lib/background/random";
import { wrapSvg } from "@/lib/background/svg";
import type { BackgroundDefinition, BackgroundSettings } from "@/types/background";

function geometry(settings: BackgroundSettings) {
  const period = r1(spacingFor(settings.density, 1, 140, 18));
  // Scale 0.25 to 4 maps to a stripe taking 20% to 80% of each period.
  const ratio = settings.scale / (settings.scale + 1);
  const stripe = r1(Math.max(1, period * ratio));
  const colors = settings.colors.length ? settings.colors : ["#ffffff"];
  // The seed shifts where the first stripe starts, so different seeds don't all line up.
  const offset = r1(createRandom(settings.seed)() * period);
  return { period, stripe, colors, offset };
}

/** Evenly spaced stripes cycling through the palette. Rotation turns them diagonal or horizontal. */
export const stripes: BackgroundDefinition = {
  kind: "stripes",
  category: "patterns",
  label: "Stripes",
  description: "Bold or pinstripe bands in your palette, at any angle.",
  defaults: { density: 55, scale: 1, rotation: 45 },
  render(settings) {
    const { width, height } = settings;
    const { period, stripe, colors, offset } = geometry(settings);
    const tileWidth = r1(period * colors.length);
    const bands = colors
      .map((color, i) => `<rect x="${r1(i * period)}" y="0" width="${stripe}" height="10" fill="${color}"/>`)
      .join("");
    // Rotate the pattern rather than the drawing: the canvas-wide rotation in wrapSvg scales up
    // to cover the corners, which would make the stripes wider than the CSS version.
    const defs = `<pattern id="stripes" width="${tileWidth}" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(${settings.rotation} ${width / 2} ${height / 2}) translate(${offset} 0)">${bands}</pattern>`;
    return wrapSvg(
      { ...settings, rotation: 0 },
      `<rect width="${width}" height="${height}" fill="url(#stripes)"/>`,
      defs,
    );
  },
  css(settings) {
    const { period, stripe, colors } = geometry(settings);
    // Stripes run perpendicular to the gradient line, so vertical stripes need a 90deg gradient.
    // The seed's phase shift is left out: it only moves the pattern, and would break the repeat.
    const stops = colors
      .flatMap((color, i) => {
        const start = r1(i * period);
        return [
          `${color} ${start}px ${r1(start + stripe)}px`,
          `transparent ${r1(start + stripe)}px ${r1(start + period)}px`,
        ];
      })
      .join(", ");
    return [
      `  background-color: ${settings.background};`,
      `  background-image: repeating-linear-gradient(${(90 + settings.rotation) % 360}deg, ${stops});`,
    ].join("\n");
  },
};
