import { defineEffect } from "@/lib/effects/define";
import { px } from "@/lib/effects/css";

/** A skewed marker band behind selectable text, including inline text spanning wrapped lines. */
export const highlighter = defineEffect({
  kind: "highlighter",
  label: "Highlighter",
  description: "A marker-style band behind text with adjustable thickness, offset and contrast.",
  generate(s) {
    const edge = 8;
    const farEdge = 92;
    return {
      declarations: [
        { property: "color", value: s.textColor },
        { property: "background-image", value: `linear-gradient(-2deg, transparent ${edge}%, ${s.color} ${edge}%, ${s.color} ${farEdge}%, transparent ${farEdge}%)` },
        { property: "background-position", value: `0 calc(50% + ${px(s.offset)})` },
        { property: "background-size", value: `100% ${s.thickness}%` },
        { property: "background-repeat", value: "no-repeat" },
        { property: "box-decoration-break", value: "clone" },
        { property: "-webkit-box-decoration-break", value: "clone" },
        { property: "padding", value: "0 0.08em" },
      ],
      plainBackdrop: true,
      extra: (selector) => `@media (forced-colors: active) {\n  ${selector} {\n    background-image: none;\n    color: CanvasText;\n    box-decoration-break: slice;\n    -webkit-box-decoration-break: slice;\n  }\n}`,
    };
  },
});
