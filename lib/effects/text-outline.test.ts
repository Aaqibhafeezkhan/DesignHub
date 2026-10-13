import { describe, expect, test } from "vitest";

import { effectStylesheet, reactStyle, tailwindClasses } from "@/lib/effects/css";
import { effectDefaults } from "@/lib/effects/defaults";
import { generateEffect } from "@/lib/effects/registry";
import type { EffectCss, TextOutlineSettings } from "@/types/effects";

const defaults = effectDefaults["text-outline"];

function generate(patch: Partial<TextOutlineSettings> = {}): EffectCss {
  return generateEffect("text-outline", { ...defaults, ...patch })!;
}

const value = (effect: EffectCss, property: string) =>
  effect.declarations.find((declaration) => declaration.property === property)?.value;

describe("text outline", () => {
  test("strokes the glyphs and empties them when hollow", () => {
    const effect = generate();
    expect(value(effect, "-webkit-text-stroke")).toBe("2px #6366f1");
    expect(value(effect, "-webkit-text-fill-color")).toBe("transparent");
    expect(value(effect, "paint-order")).toBeUndefined();
  });

  test("keeps a solid color first, so text stays readable where the stroke is ignored", () => {
    const hollow = generate();
    expect(hollow.declarations[0]).toEqual({ property: "color", value: "#6366f1" });
    const filled = generate({ hollow: false, fill: "#ffffff" });
    expect(filled.declarations[0]).toEqual({ property: "color", value: "#ffffff" });
    expect(value(filled, "-webkit-text-fill-color")).toBe("#ffffff");
    expect(value(filled, "paint-order")).toBe("stroke fill");
  });

  test("the shadow copy is optional and offset", () => {
    expect(value(generate(), "text-shadow")).toBe("4px 4px 0 #f472b6");
    expect(value(generate({ shadow: false }), "text-shadow")).toBeUndefined();
    expect(value(generate({ shadowX: -6, shadowY: 0 }), "text-shadow")).toBe("-6px 0 0 #f472b6");
  });

  test("high contrast themes get plain glyphs", () => {
    expect(effectStylesheet(generate(), ".fx")).toContain("@media (forced-colors: active)");
  });

  test("other formats carry the stroke", () => {
    expect(tailwindClasses(generate().declarations)).toContain("[-webkit-text-stroke:2px_#6366f1]");
    expect(reactStyle("text-outline", generate())).toContain('WebkitTextStroke: "2px #6366f1",');
  });
});
