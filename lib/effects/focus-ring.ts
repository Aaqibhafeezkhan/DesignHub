import { focusIndicatorCheck, type FocusIndicatorCheck } from "@/lib/a11y/contrast";
import { px } from "@/lib/effects/css";
import { defineEffect } from "@/lib/effects/define";
import type { FocusRingSettings } from "@/types/effects";

/**
 * The same WCAG 2.4.13 and 1.4.11 check the Accessibility Lab runs: the outer ring needs 3:1
 * against the page and against the component it surrounds.
 */
export function focusRingCheck(s: FocusRingSettings): FocusIndicatorCheck {
  return focusIndicatorCheck(s.color, s.background, s.component);
}

/**
 * A two-tone focus ring. The outline is the outer ring; a box-shadow as wide as the offset paints
 * the inner ring in the gap between the component and the outline, so the ring stays visible on
 * both light and dark neighbors. Apply it on `:focus-visible` (`focus-visible:fx-focus-ring`).
 */
export const focusRing = defineEffect({
  kind: "focus-ring",
  category: "states",
  label: "Focus ring",
  description: "A two-tone :focus-visible ring with a built-in WCAG contrast check.",
  generate(s) {
    return {
      declarations: [
        { property: "outline", value: `${px(s.width)} solid ${s.color}` },
        { property: "outline-offset", value: px(s.offset) },
        { property: "box-shadow", value: `0 0 0 ${px(s.offset)} ${s.inner}` },
      ],
      surface: s.background,
      fill: s.component,
      tailwindNote:
        "Apply the classes with the focus-visible: variant (or use focus-visible:fx-focus-ring) so the ring only shows for keyboard focus.",
      extra: (selector) => `@media (forced-colors: active) {
  ${selector} {
    outline-color: Highlight;
    box-shadow: none;
  }
}`,
    };
  },
});
