import { defineEffect } from "@/lib/effects/define";
import { px } from "@/lib/effects/css";

/**
 * Gradient borders without extra markup: a solid fill clipped to the padding box sits on
 * top of a gradient clipped to the border box. The transparent border reveals the gradient.
 */
export const border = defineEffect({
  kind: "border",
  category: "surfaces",
  label: "Border",
  description: "Gradient and animated borders, no extra elements.",
  generate(s) {
    const stops = s.colors.length ? s.colors : ["#6366f1", "#f472b6"];
    const fill = `linear-gradient(${s.fill}, ${s.fill}) padding-box`;
    const gradient = s.animated
      ? `conic-gradient(from var(--border-angle), ${[...stops, stops[0]].join(", ")}) border-box`
      : `linear-gradient(${s.angle}deg, ${stops.join(", ")}) border-box`;

    const declarations = [
      { property: "border", value: `${px(s.thickness)} solid transparent` },
      { property: "border-radius", value: px(s.radius) },
      { property: "background", value: `${fill}, ${gradient}` },
      ...(s.animated ? [{ property: "animation", value: `border-spin ${s.speed}s linear infinite` }] : []),
    ];

    return {
      declarations,
      tailwindNote: s.animated
        ? "Animated borders also need the @property and @keyframes rules from the CSS tab in your stylesheet."
        : undefined,
      global: s.animated
        ? `@property --border-angle {
  syntax: "<angle>";
  inherits: false;
  initial-value: 0deg;
}

@keyframes border-spin {
  to {
    --border-angle: 360deg;
  }
}`
        : undefined,
      extra: s.animated
        ? (selector) => `@media (prefers-reduced-motion: reduce) {
  ${selector} {
    animation: none;
  }
}`
        : undefined,
    };
  },
});
