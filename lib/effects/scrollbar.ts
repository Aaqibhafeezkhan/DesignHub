import { contrastRatio, parseColor } from "@/lib/color/color";
import { px } from "@/lib/effects/css";
import { defineEffect } from "@/lib/effects/define";
import type { ScrollbarSettings } from "@/types/effects";

/** WCAG 1.4.11: a user interface component needs 3:1 against what is next to it. */
export const SCROLLBAR_MIN_CONTRAST = 3;

/** The thumb against the track, the pair WCAG 1.4.11 asks for. Unparseable colors measure as 1. */
export function scrollbarContrast(s: ScrollbarSettings): number {
  const thumb = parseColor(s.thumb);
  const track = parseColor(s.track);
  return thumb && track ? contrastRatio(thumb, track) : 1;
}

/**
 * A styled scrollbar for a scrollable box. `scrollbar-color` and `scrollbar-width` are the
 * standard properties; where they are unsupported (older Safari and Chromium), `::-webkit-scrollbar`
 * rules do the same job, with a hover color. Chromium 121 and later ignore the WebKit rules whenever
 * the standard properties are set, so they sit behind `@supports not`.
 */
export const scrollbar = defineEffect({
  kind: "scrollbar",
  category: "states",
  label: "Scrollbar",
  description: "Thumb and track colors, width and radius, with a standard and a WebKit fallback.",
  generate(s) {
    return {
      declarations: [
        { property: "scrollbar-color", value: `${s.thumb} ${s.track}` },
        { property: "scrollbar-width", value: s.width <= 10 ? "thin" : "auto" },
      ],
      tailwindNote:
        "Add the classes to the scrollable element. The WebKit fallback and hover color need the CSS tab or the utility.",
      extra: (selector) => `@supports not (scrollbar-color: auto) {
  ${selector}::-webkit-scrollbar {
    width: ${px(s.width)};
    height: ${px(s.width)};
  }

  ${selector}::-webkit-scrollbar-track {
    background: ${s.track};
  }

  ${selector}::-webkit-scrollbar-thumb {
    background: ${s.thumb};
    border-radius: ${px(s.radius)};
  }

  ${selector}::-webkit-scrollbar-thumb:hover {
    background: ${s.thumbHover};
  }
}`,
    };
  },
});
