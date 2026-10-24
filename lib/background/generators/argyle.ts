import { patternSvg, spacingFor } from "@/lib/background/pattern";
import { r1 } from "@/lib/background/random";
import type { BackgroundVariantDefinition } from "@/types/background";

/** A diamond with its points at the given half width and half height. */
function diamond(cx: number, cy: number, hw: number, hh: number, fill: string): string {
  return `<path d="M${r1(cx)} ${r1(cy - hh)}L${r1(cx + hw)} ${r1(cy)}L${r1(cx)} ${r1(cy + hh)}L${r1(cx - hw)} ${r1(cy)}Z" fill="${fill}"/>`;
}

/** Overlapping palette diamonds with thin diagonal stitch lines. */
export const argyle: BackgroundVariantDefinition = {
  variant: "argyle",
  label: "Argyle",
  description: "Overlapping diamonds with thin diagonal stitch lines, like a knitted sock.",
  defaults: { density: 40, scale: 1 },
  render(settings) {
    const w = r1(spacingFor(settings.density, settings.scale, 200, 48));
    const h = r1(w * 1.5);
    const colors = settings.colors.length ? settings.colors : ["#888888"];
    const first = colors[0]!;
    const second = colors[1] ?? settings.background;
    const third = colors[2] ?? first;
    // The corner diamonds are a little larger than the gap, so they tuck under the center one.
    const reach = 1.08;
    const corners = [
      [0, 0],
      [w, 0],
      [0, h],
      [w, h],
    ] as const;
    const body =
      corners.map(([x, y]) => diamond(x, y, (w / 2) * reach, (h / 2) * reach, second)).join("") +
      diamond(w / 2, h / 2, w / 2, h / 2, first) +
      diamond(w / 2, h / 2, w * 0.2, h * 0.2, third);
    const stitch = r1(Math.max(1, w * 0.012));
    const dash = r1(Math.max(2, w * 0.04));
    const lines =
      `<path d="M0 0L${w} ${h}M${w} 0L0 ${h}" fill="none" stroke="${settings.background}" stroke-opacity="0.7" ` +
      `stroke-width="${stitch}" stroke-dasharray="${dash} ${dash}"/>`;
    return patternSvg(settings, w, h, body + lines);
  },
};
