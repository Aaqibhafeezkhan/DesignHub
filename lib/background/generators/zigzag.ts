import { patternSvg, spacingFor } from "@/lib/background/pattern";
import { createRandom, pick, r1 } from "@/lib/background/random";
import type { BackgroundVariantDefinition } from "@/types/background";

const pathNumber = (value: number) => String(r1(value)).replace(/^(-?)0\./, "$1.");

/** Fine, repeating chevron strokes with seeded palette colors on each row. */
export const zigzag: BackgroundVariantDefinition = {
  variant: "zigzag",
  label: "Zigzag",
  description: "Fine zigzag strokes in seeded palette colors.",
  defaults: { density: 45, scale: 1 },
  render(settings) {
    const rowSpacing = r1(spacingFor(settings.density, 1, 96, 32));
    const amplitude = r1(3 * settings.scale);
    const colors = settings.colors.length ? settings.colors : ["#888888"];
    const rowCount = Math.min(12, Math.max(4, colors.length * 2));
    const tileWidth = 56;
    const tileHeight = r1(rowSpacing * rowCount);
    const random = createRandom(settings.seed);
    const tile = Array.from({ length: rowCount }, (_, row) => {
      const y = (row + 0.5) * rowSpacing;
      const color = pick(random, colors);
      const path =
        `M0 ${pathNumber(y + amplitude)}` +
        `L${pathNumber(tileWidth / 2)} ${pathNumber(y - amplitude)}` +
        `L${pathNumber(tileWidth)} ${pathNumber(y + amplitude)}`;
      return `<path d="${path}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round"/>`;
    }).join("");
    return patternSvg(settings, tileWidth, tileHeight, tile);
  },
};
