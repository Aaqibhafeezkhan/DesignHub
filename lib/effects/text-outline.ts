import { px } from "@/lib/effects/css";
import { defineEffect } from "@/lib/effects/define";

/**
 * Outlined text: `-webkit-text-stroke` draws the outline and `-webkit-text-fill-color` empties the
 * glyphs (or fills them). `color` is set first and stays a solid, readable fallback: a browser that
 * ignores the stroke properties shows plain text in it, still real, selectable text. A hollow
 * outline falls back to the stroke color, a filled one to its fill color.
 */
export const textOutline = defineEffect({
  kind: "text-outline",
  label: "Text outline",
  description: "Outlined text with an optional offset shadow copy and a solid fallback.",
  generate(s) {
    const declarations = [
      { property: "color", value: s.hollow ? s.color : s.fill },
      { property: "-webkit-text-stroke", value: `${px(s.width)} ${s.color}` },
      { property: "-webkit-text-fill-color", value: s.hollow ? "transparent" : s.fill },
      // Strokes are centered on the glyph edge; painting them first keeps a filled glyph's weight.
      ...(s.hollow ? [] : [{ property: "paint-order", value: "stroke fill" }]),
      ...(s.shadow ? [{ property: "text-shadow", value: `${px(s.shadowX)} ${px(s.shadowY)} 0 ${s.shadowColor}` }] : []),
    ];

    return {
      declarations,
      // An outline reads best on a calm backdrop, so the preview shows it on light or dark.
      plainBackdrop: true,
      // High contrast themes force the text color, so draw plain glyphs in it instead of an outline.
      extra: (selector) => `@media (forced-colors: active) {
  ${selector} {
    -webkit-text-stroke: 0;
    -webkit-text-fill-color: currentColor;
    text-shadow: none;
  }
}`,
    };
  },
});
