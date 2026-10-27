import { contrastRatio, parseColor } from "@/lib/color/color";
import { defineEffect } from "@/lib/effects/define";
import type { SelectionSettings } from "@/types/effects";

/** WCAG 1.4.3: selected text needs 4.5:1 against the selection color. */
export const SELECTION_MIN_CONTRAST = 4.5;

/** The selected text against the selection background. Unparseable colors measure as 1. */
export function selectionContrast(s: SelectionSettings): number {
  const text = parseColor(s.text);
  const background = parseColor(s.background);
  return text && background ? contrastRatio(text, background) : 1;
}

/**
 * The color of selected text. `::selection` takes only a few properties and can't carry the
 * regular declarations, so the rule lives in `extra`; the main rule sets the caret color to match,
 * which keeps every export format non-empty. In Tailwind, use `selection:bg-[...] selection:text-[...]`.
 */
export const selection = defineEffect({
  kind: "selection",
  category: "text",
  label: "Selection",
  description: "The background and text color of selected text, with a 4.5:1 contrast check.",
  generate(s) {
    return {
      declarations: [{ property: "caret-color", value: s.background }],
      surface: s.page,
      tailwindNote: `Use selection:bg-[${s.background}] selection:text-[${s.text}] on the element (or its ancestor). The CSS tab has the ::selection rule.`,
      extra: (selector) => `${selector}::selection,
${selector} ::selection {
  background-color: ${s.background};
  color: ${s.text};
}

@media (forced-colors: active) {
  ${selector}::selection,
  ${selector} ::selection {
    background-color: Highlight;
    color: HighlightText;
  }
}`,
    };
  },
});
