import { describe, expect, test } from "vitest";

import { contrastRatio, parseColor } from "@/lib/color/color";
import { effectStylesheet, reactStyle, scssMixin, tailwindClasses, tailwindUtility } from "@/lib/effects/css";
import { effectDefaults } from "@/lib/effects/defaults";
import { generateEffect } from "@/lib/effects/registry";
import type { HighlighterSettings } from "@/types/effects";

const defaults = effectDefaults.highlighter;
const generate = (patch: Partial<HighlighterSettings> = {}) =>
  generateEffect("highlighter", { ...defaults, ...patch })!;
const value = (effect: ReturnType<typeof generate>, property: string) =>
  effect.declarations.find((declaration) => declaration.property === property)?.value;

describe("highlighter text", () => {
  test("generates a skewed marker band and clones it across wrapped lines", () => {
    const effect = generate({ color: "#fde047", thickness: 56, offset: 2 });
    expect(value(effect, "background-image")).toBe(
      "linear-gradient(-2deg, transparent 8%, #fde047 8%, #fde047 92%, transparent 92%)",
    );
    expect(value(effect, "background-position")).toBe("0 calc(50% + 2px)");
    expect(value(effect, "box-decoration-break")).toBe("clone");
    expect(value(effect, "-webkit-box-decoration-break")).toBe("clone");
    expect(value(effect, "background-repeat")).toBe("no-repeat");
    expect(value(effect, "background-size")).toBe("100% 56%");
  });

  test("keeps the text color and exports the generated CSS", () => {
    const effect = generate({ textColor: "#18181b" });
    const css = effectStylesheet(effect, ".highlighter");
    expect(css).toContain("color: #18181b;");
    expect(css).toContain("background-image: linear-gradient(-2deg");
    expect(css).toContain(".highlighter {");
    expect(css).toContain("@media (forced-colors: active)");
    expect(tailwindClasses(effect.declarations)).toContain("[box-decoration-break:clone]");
    expect(tailwindUtility("fx-highlighter", effect)).toContain("@utility fx-highlighter");
    expect(scssMixin("fx-highlighter", effect)).toContain("@mixin fx-highlighter");
    expect(reactStyle("highlighter", effect)).toContain('boxDecorationBreak: "clone"');
  });

  test("checks text-to-highlight contrast against the 4.5:1 WCAG AA threshold", () => {
    const text = parseColor(defaults.textColor)!;
    const highlight = parseColor(defaults.color)!;
    expect(contrastRatio(text, highlight)).toBeGreaterThanOrEqual(4.5);
    const lowContrast = contrastRatio(parseColor("#fde047")!, parseColor("#fff59d")!);
    expect(lowContrast).toBeLessThan(4.5);
  });
});
