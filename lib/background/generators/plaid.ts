import { patternSvg, spacingFor } from "@/lib/background/pattern";
import { createRandom, pick, r1, range } from "@/lib/background/random";
import type { BackgroundDefinition } from "@/types/background";

/** Bands per direction in one tile. */
const BANDS = 3;

export type PlaidBand = { start: number; size: number; color: string };

/**
 * One direction's bands for a tile of `period` px: they never cross the tile edge, so the pattern
 * repeats without a seam, and they are spread over thirds of the tile so they don't pile up.
 */
export function plaidBands(random: () => number, period: number, colors: string[]): PlaidBand[] {
  return Array.from({ length: BANDS }, (_, i) => {
    const size = period * range(random, 0.06, 0.2);
    const slot = period / BANDS;
    const start = i * slot + range(random, 0, Math.max(0, slot - size));
    return { start: r1(start), size: r1(size), color: pick(random, colors) };
  });
}

/** Overlapping translucent horizontal and vertical bands, like a tartan or gingham. */
export const plaid: BackgroundDefinition = {
  kind: "plaid",
  label: "Plaid",
  description: "Translucent crossing bands in your palette, like a tartan or gingham.",
  defaults: { density: 45, scale: 1 },
  render(settings) {
    const period = r1(spacingFor(settings.density, settings.scale, 320, 80));
    const colors = settings.colors.length ? settings.colors : ["#888888"];
    const random = createRandom(settings.seed + 307);
    const horizontal = plaidBands(random, period, colors);
    const vertical = plaidBands(random, period, colors);
    // Where a horizontal and a vertical band cross, the two opacities add up to a darker weave.
    const rects = [
      ...horizontal.map(
        (band) =>
          `<rect x="0" y="${band.start}" width="${period}" height="${band.size}" fill="${band.color}" fill-opacity=".45"/>`,
      ),
      ...vertical.map(
        (band) =>
          `<rect x="${band.start}" y="0" width="${band.size}" height="${period}" fill="${band.color}" fill-opacity=".45"/>`,
      ),
    ];
    const pin = (position: number) => r1(position);
    const lines = [horizontal, vertical].flatMap((bands, direction) =>
      bands.map((band) => {
        const at = pin(band.start + band.size / 2);
        return direction === 0
          ? `<path d="M0 ${at}H${period}" stroke="${band.color}" stroke-opacity=".7" stroke-width="1"/>`
          : `<path d="M${at} 0V${period}" stroke="${band.color}" stroke-opacity=".7" stroke-width="1"/>`;
      }),
    );
    return patternSvg(settings, period, period, rects.join("") + lines.join(""));
  },
};
