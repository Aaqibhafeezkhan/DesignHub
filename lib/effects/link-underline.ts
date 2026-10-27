import { contrastRatio, parseColor } from "@/lib/color/color";
import { px } from "@/lib/effects/css";
import { defineEffect } from "@/lib/effects/define";
import type { LinkUnderlineSettings } from "@/types/effects";

/** WCAG 1.4.3: the link color needs 4.5:1 against the page. */
export const LINK_UNDERLINE_MIN_CONTRAST = 4.5;

/** How long the underline takes to grow. Inside the 150-200ms motion range. */
const GROW_MS = 200;

/** The link color against the page. Unparseable colors measure as 1. */
export function linkUnderlineContrast(s: LinkUnderlineSettings): number {
  const color = parseColor(s.color);
  const page = parseColor(s.page);
  return color && page ? contrastRatio(color, page) : 1;
}

/**
 * A link underline. Thickness, offset and color are `text-decoration-*` properties, so a static
 * export still underlines the text. The line that grows is a background bar of the same thickness
 * and offset: it starts at zero width and transitions to full width on hover. While it grows, the
 * native underline is hidden so the two lines don't stack. Reduced motion removes that transition.
 */
export const linkUnderline = defineEffect({
  kind: "link-underline",
  category: "text",
  label: "Link underline",
  description: "A link underline with thickness, offset and color that grows on hover, with a reduced-motion fallback.",
  generate(s) {
    const bar = px(s.thickness);
    return {
      declarations: [
        { property: "color", value: s.color },
        { property: "text-decoration-line", value: "underline" },
        { property: "text-decoration-color", value: s.color },
        { property: "text-decoration-thickness", value: bar },
        { property: "text-underline-offset", value: px(s.offset) },
        { property: "background-image", value: `linear-gradient(${s.color}, ${s.color})` },
        { property: "background-repeat", value: "no-repeat" },
        { property: "background-position", value: `0 calc(100% - ${px(s.offset)})` },
        { property: "background-size", value: `0% ${bar}` },
        { property: "transition", value: `background-size ${GROW_MS}ms ease` },
      ],
      surface: s.page,
      tailwindNote:
        "The growing underline is a separate hover rule: copy it from the CSS tab, or add a hover: variant for background-size.",
      extra: (selector) =>
        `${selector}:hover {
  background-size: 100% ${bar};
  text-decoration-color: transparent;
}

@media (prefers-reduced-motion: reduce) {
  ${selector},
  ${selector}:hover {
    transition: none;
  }
}`,
    };
  },
});
