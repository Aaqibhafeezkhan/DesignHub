import { contrastRatio, parseColor, toHex } from "@/lib/color/color";
import { hexToRgba } from "@/lib/effects/css";
import { defineEffect } from "@/lib/effects/define";
import type { ScrimSettings } from "@/types/effects";

/** WCAG 1.4.3: normal text needs 4.5:1 against what is behind it. */
export const SCRIM_MIN_CONTRAST = 4.5;

export type ScrimContrast = {
  /** Text against the scrim at its strongest, at the edge it grows from, over a white image. */
  darkest: number;
  /** Text against the scrim where it has faded out, over a white image: the page's own white. */
  lightest: number;
  /** How far into the scrim, from its edge, text still reaches 4.5:1 (0 to 1). Zero when it never does. */
  readableDepth: number;
};

const WHITE = "#ffffff";

/** The scrim color at `alpha` over a white image, as a hex color. The browser blends in sRGB, so this does too. */
function overWhite(color: string, alpha: number): string {
  const parsed = parseColor(color);
  if (!parsed) return WHITE;
  const hex = toHex(parsed).slice(1);
  const channel = (offset: number) => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16);
    return Math.round(value * alpha + 255 * (1 - alpha));
  };
  return `#${[0, 2, 4].map((offset) => channel(offset).toString(16).padStart(2, "0")).join("")}`;
}

function ratio(text: string, behind: string): number {
  const foreground = parseColor(text);
  const background = parseColor(behind);
  return foreground && background ? contrastRatio(foreground, background) : 1;
}

/**
 * The text color against the scrim over a white image, the worst case for readability. The scrim's
 * opacity falls linearly from `strength` at its edge to zero, so the readable depth is found by
 * stepping inward until the contrast drops under 4.5:1.
 */
export function scrimContrast(s: Pick<ScrimSettings, "color" | "strength" | "text">): ScrimContrast {
  const darkest = ratio(s.text, overWhite(s.color, s.strength));
  const lightest = ratio(s.text, WHITE);
  let readableDepth = 0;
  if (darkest >= SCRIM_MIN_CONTRAST) {
    const steps = 100;
    for (let step = 1; step <= steps; step++) {
      const depth = step / steps;
      if (ratio(s.text, overWhite(s.color, s.strength * (1 - depth))) < SCRIM_MIN_CONTRAST) break;
      readableDepth = depth;
    }
  }
  return { darkest, lightest, readableDepth };
}

/**
 * A gradient overlay that darkens the bottom (or top) of an image so text on it stays readable. The
 * overlay is a `::after` layer that grows from one edge, so it works on any box with an image behind
 * it, and the box's own content is lifted above it.
 */
export const scrim = defineEffect({
  kind: "scrim",
  label: "Scrim",
  description: "A gradient that darkens the bottom or top of an image so text over it stays readable.",
  generate(s) {
    const edge = s.direction === "top" ? "top" : "bottom";
    const toward = edge === "top" ? "to bottom" : "to top";
    return {
      declarations: [
        { property: "position", value: "relative" },
        { property: "isolation", value: "isolate" },
      ],
      tailwindNote: "The overlay is a ::after layer: copy it from the CSS tab, or use the @utility or SCSS output.",
      extra: (selector) =>
        `${selector}::after {
  content: "";
  position: absolute;
  inset: ${edge === "top" ? "0 0 auto" : "auto 0 0"};
  height: ${s.height}%;
  background: linear-gradient(${toward}, ${hexToRgba(s.color, s.strength)}, ${hexToRgba(s.color, 0)});
  pointer-events: none;
}

/* Lift the content above the overlay. */
${selector} > * {
  position: relative;
  z-index: 1;
}`,
    };
  },
});
