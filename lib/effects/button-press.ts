import { readableTextColor, toHex, parseColor } from "@/lib/color/color";
import { px } from "@/lib/effects/css";
import { defineEffect } from "@/lib/effects/define";
import type { ButtonPressEasing } from "@/types/effects";

/** The CSS timing function for each easing choice. */
export const BUTTON_PRESS_EASINGS: Record<ButtonPressEasing, string> = {
  "ease-out": "cubic-bezier(0.16, 1, 0.3, 1)",
  "ease-in-out": "cubic-bezier(0.65, 0, 0.35, 1)",
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  linear: "linear",
};

/** Label color for the button: whichever of white or black reads better on the fill. */
export function buttonPressText(fill: string): string {
  const color = parseColor(fill);
  return color ? toHex(readableTextColor(color)) : "#ffffff";
}

/**
 * A button that lifts on hover and sinks when pressed. The base rule sets the color, a resting
 * shadow and the transition. `:hover` raises the button by `lift` and deepens the shadow, `:active`
 * pushes it down by `press` and flattens the shadow. Under `prefers-reduced-motion` the transform and
 * the transition are removed, and the shadow still changes, so the states stay visible without motion.
 */
export const buttonPress = defineEffect({
  kind: "button-press",
  label: "Button press",
  description: "A hover lift and a pressed state with a transform and shadow change, with a reduced-motion fallback.",
  generate(s) {
    const timing = `${s.duration}ms ${BUTTON_PRESS_EASINGS[s.easing]}`;
    const rest = `0 1px 2px rgb(0 0 0 / 0.2)`;
    const raised = `0 ${px(s.lift + 4)} ${px(s.lift * 2 + 8)} rgb(0 0 0 / 0.25)`;
    const pressed = `0 0 1px rgb(0 0 0 / 0.3)`;
    return {
      declarations: [
        { property: "background-color", value: s.fill },
        { property: "color", value: buttonPressText(s.fill) },
        { property: "border-radius", value: px(s.radius) },
        { property: "box-shadow", value: rest },
        { property: "transform", value: "translateY(0)" },
        { property: "transition", value: `transform ${timing}, box-shadow ${timing}` },
      ],
      needsFill: true,
      tailwindNote:
        "The hover and pressed states are separate rules: copy them from the CSS tab, or add hover: and active: variants for transform and box-shadow.",
      extra: (selector) =>
        [
          `${selector}:hover {
  transform: translateY(${px(-s.lift)});
  box-shadow: ${raised};
}`,
          `${selector}:active {
  transform: translateY(${px(s.press)});
  box-shadow: ${pressed};
}`,
          `@media (prefers-reduced-motion: reduce) {
  ${selector},
  ${selector}:hover,
  ${selector}:active {
    transform: none;
    transition: none;
  }
}`,
        ].join("\n\n"),
    };
  },
});
