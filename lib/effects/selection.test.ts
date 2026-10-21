import { describe, expect, test } from "vitest";

import { effectsBundle } from "@/lib/effects/bundle";
import { effectStylesheet } from "@/lib/effects/css";
import { effectDefaults } from "@/lib/effects/defaults";
import { generateEffect } from "@/lib/effects/registry";
import { SELECTION_MIN_CONTRAST, selectionContrast } from "@/lib/effects/selection";
import type { SelectionSettings } from "@/types/effects";

const defaults = effectDefaults.selection;
const pick = (patch: Partial<SelectionSettings> = {}): SelectionSettings => ({ ...defaults, ...patch });

describe("selection", () => {
  test("writes the ::selection rule for the element and its descendants, plus forced colors", () => {
    const css = effectStylesheet(generateEffect("selection", pick())!, ".fx-selection");
    expect(css).toContain(".fx-selection::selection,\n.fx-selection ::selection {");
    expect(css).toContain("background-color: #4f46e5;");
    expect(css).toContain("color: #ffffff;");
    expect(css).toContain("caret-color: #4f46e5;");
    expect(css).toContain("background-color: Highlight;");
  });

  test("tells Tailwind users the selection: variants to use", () => {
    expect(generateEffect("selection", pick())!.tailwindNote).toContain(
      "selection:bg-[#4f46e5] selection:text-[#ffffff]",
    );
  });

  test("is in the effects.css bundle", () => {
    expect(effectsBundle(effectDefaults)).toContain("/* Selection */\n.fx-selection {");
  });

  test("checks selected text against the selection color for 4.5:1", () => {
    expect(selectionContrast(pick())).toBeGreaterThanOrEqual(SELECTION_MIN_CONTRAST);
    expect(selectionContrast(pick({ background: "#fde047", text: "#ffffff" }))).toBeLessThan(SELECTION_MIN_CONTRAST);
    expect(selectionContrast(pick({ text: "nope" }))).toBe(1);
  });
});
