import { defineEffect } from "@/lib/effects/define";
import { hexToRgba, px } from "@/lib/effects/css";

/** Three halos (tight, mid, wide) read as a real bloom instead of one flat blur. */
function halo(color: string, radius: number, intensity: number): string {
  return [
    `0 0 ${px(radius * 0.2)} ${hexToRgba(color, Math.min(1, intensity))}`,
    `0 0 ${px(radius * 0.55)} ${hexToRgba(color, intensity * 0.6)}`,
    `0 0 ${px(radius)} ${hexToRgba(color, intensity * 0.35)}`,
  ].join(", ");
}

export const glow = defineEffect({
  kind: "glow",
  category: "surfaces",
  label: "Glow",
  description: "Neon-style bloom for cards, buttons and text.",
  generate(s) {
    return {
      needsFill: true,
      declarations: [
        { property: "border", value: `1px solid ${hexToRgba(s.color, 0.6)}` },
        { property: "border-radius", value: px(s.radiusCorner) },
        { property: "box-shadow", value: halo(s.color, s.radius, s.intensity) },
        ...(s.text ? [{ property: "text-shadow", value: halo(s.color, s.radius * 0.5, s.intensity) }] : []),
      ],
    };
  },
});
