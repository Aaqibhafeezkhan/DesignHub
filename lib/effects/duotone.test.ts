import { describe, expect, test } from "vitest";

import { effectsBundle } from "@/lib/effects/bundle";
import { effectStylesheet, reactStyle, scssMixin, tailwindClasses, tailwindUtility } from "@/lib/effects/css";
import { effectDefaults } from "@/lib/effects/defaults";
import { DUOTONE_FILTER_ID, duotoneFilterMarkup, duotoneFilterUrl, duotoneTableValues } from "@/lib/effects/duotone";
import { generateEffect } from "@/lib/effects/registry";
import type { DuotoneSettings, EffectCss } from "@/types/effects";

const defaults = effectDefaults.duotone;
const generate = (patch: Partial<DuotoneSettings> = {}): EffectCss =>
  generateEffect("duotone", { ...defaults, ...patch })!;

const value = (effect: EffectCss, property: string) =>
  effect.declarations.find((declaration) => declaration.property === property)?.value;

describe("duotone", () => {
  test("maps two known colors to the expected feComponentTransfer table values", () => {
    expect(duotoneTableValues({ shadow: "#000000", highlight: "#ffffff" })).toEqual({
      r: "0 1",
      g: "0 1",
      b: "0 1",
    });
    expect(duotoneTableValues({ shadow: "#ff0000", highlight: "#00ff00" })).toEqual({
      r: "1 0",
      g: "0 1",
      b: "0 0",
    });
    // Default brand indigo / amber: 30/255, 27/255, 75/255 and 251/255, 191/255, 36/255.
    expect(duotoneTableValues({ shadow: "#1e1b4b", highlight: "#fbbf24" })).toEqual({
      r: "0.1176 0.9843",
      g: "0.1059 0.749",
      b: "0.2941 0.1412",
    });
  });

  test("exports an SVG filter with feColorMatrix and feComponentTransfer that the CSS filter URL points at", () => {
    const settings = { shadow: "#1e1b4b", highlight: "#fbbf24", strength: 0.75 };
    const markup = duotoneFilterMarkup(settings);
    expect(markup).toContain(`id='${DUOTONE_FILTER_ID}'`);
    expect(markup).toContain("feColorMatrix");
    expect(markup).toContain("type='saturate'");
    expect(markup).toContain("feComponentTransfer");
    expect(markup).toContain("tableValues='0.1176 0.9843'");
    expect(markup).toContain("tableValues='0.1059 0.749'");
    expect(markup).toContain("tableValues='0.2941 0.1412'");
    expect(markup).toContain("slope='0.75'");
    const url = duotoneFilterUrl(settings);
    expect(url).toContain(`#${DUOTONE_FILTER_ID}`);
    expect(decodeURIComponent(url)).toContain("<filter id='duotone'");
    expect(value(generate(settings), "filter")).toBe(url);
  });

  test("exports every Effects Lab format and a rule in effects.css", () => {
    const effect = generate();
    const css = effectStylesheet(effect, ".fx-duotone");
    expect(css).toContain(".fx-duotone {");
    expect(css).toContain("filter:");
    expect(css).toContain("feColorMatrix");
    expect(tailwindClasses(effect.declarations)).toContain("[filter:");
    expect(tailwindUtility("fx-duotone", effect)).toContain("@utility fx-duotone");
    expect(scssMixin("fx-duotone", effect)).toContain("@mixin fx-duotone");
    expect(reactStyle("duotone", effect)).toContain("filter:");
    expect(effectsBundle(effectDefaults)).toContain("/* Duotone */\n.fx-duotone {");
    expect(effectsBundle(effectDefaults)).toContain("feComponentTransfer");
  });

  test("clamps strength into the 0-1 range used by the alpha slope", () => {
    expect(duotoneFilterMarkup({ ...defaults, strength: 2 })).toContain("slope='1'");
    expect(duotoneFilterMarkup({ ...defaults, strength: -0.5 })).toContain("slope='0'");
  });
});
