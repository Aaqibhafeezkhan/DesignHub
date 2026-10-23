import { describe, expect, test } from "vitest";

import { effectsBundle } from "@/lib/effects/bundle";
import { effectStylesheet, reactStyle, scssMixin, tailwindClasses, tailwindUtility } from "@/lib/effects/css";
import { effectDefaults } from "@/lib/effects/defaults";
import { generateEffect } from "@/lib/effects/registry";
import { SCRIM_MIN_CONTRAST, scrimContrast } from "@/lib/effects/scrim";
import type { EffectCss, ScrimSettings } from "@/types/effects";

const defaults = effectDefaults.scrim;
const generate = (patch: Partial<ScrimSettings> = {}): EffectCss => generateEffect("scrim", { ...defaults, ...patch })!;

describe("scrim", () => {
  test("grows an overlay from the bottom edge, fading to transparent", () => {
    const css = effectStylesheet(generate({ strength: 0.6, height: 50 }), ".hero");
    expect(css).toContain(".hero::after {");
    expect(css).toContain("inset: auto 0 0;");
    expect(css).toContain("height: 50%;");
    expect(css).toContain("linear-gradient(to top, rgb(0 0 0 / 0.6), rgb(0 0 0 / 0))");
  });

  test("grows from the top when asked", () => {
    const css = effectStylesheet(generate({ direction: "top" }), ".hero");
    expect(css).toContain("inset: 0 0 auto;");
    expect(css).toContain("linear-gradient(to bottom,");
  });

  test("positions the box and lifts its content above the overlay", () => {
    const effect = generate();
    expect(effect.declarations).toContainEqual({ property: "position", value: "relative" });
    expect(effectStylesheet(effect, ".hero")).toContain(".hero > * {");
  });

  test("exports in every format and in the bundle", () => {
    const effect = generate();
    expect(tailwindClasses(effect.declarations)).toContain("[position:relative]");
    expect(tailwindUtility("fx-scrim", effect)).toContain("&::after {");
    expect(scssMixin("fx-scrim", effect)).toContain("&::after {");
    expect(reactStyle("scrim", effect)).toContain('position: "relative"');
    expect(effectsBundle(effectDefaults)).toContain("/* Scrim */\n.fx-scrim {");
  });

  test("white text over a strong black scrim passes where the scrim is strongest", () => {
    const { darkest, lightest, readableDepth } = scrimContrast({ color: "#000000", strength: 0.7, text: "#ffffff" });
    expect(darkest).toBeGreaterThanOrEqual(SCRIM_MIN_CONTRAST);
    expect(lightest).toBeCloseTo(1, 5);
    expect(readableDepth).toBeGreaterThan(0);
    expect(readableDepth).toBeLessThan(1);
  });

  test("a faint scrim fails, with no readable depth", () => {
    const { darkest, readableDepth } = scrimContrast({ color: "#000000", strength: 0.15, text: "#ffffff" });
    expect(darkest).toBeLessThan(SCRIM_MIN_CONTRAST);
    expect(readableDepth).toBe(0);
  });

  test("a stronger scrim stays readable deeper into the image", () => {
    const weak = scrimContrast({ color: "#000000", strength: 0.6, text: "#ffffff" }).readableDepth;
    const strong = scrimContrast({ color: "#000000", strength: 0.95, text: "#ffffff" }).readableDepth;
    expect(strong).toBeGreaterThan(weak);
  });

  test("dark text over a white scrim works the same way", () => {
    expect(scrimContrast({ color: "#ffffff", strength: 1, text: "#000000" }).darkest).toBeGreaterThan(20);
  });
});
