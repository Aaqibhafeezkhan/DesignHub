import { describe, expect, test } from "vitest";

import { contrastRatio, parseColor } from "@/lib/color/color";
import { BUTTON_PRESS_EASINGS, buttonPressText } from "@/lib/effects/button-press";
import { effectStylesheet } from "@/lib/effects/css";
import { effectDefaults } from "@/lib/effects/defaults";
import { generateEffect } from "@/lib/effects/registry";
import type { ButtonPressSettings, EffectCss } from "@/types/effects";

const defaults = effectDefaults["button-press"];
const generate = (patch: Partial<ButtonPressSettings> = {}): EffectCss =>
  generateEffect("button-press", { ...defaults, ...patch })!;

const value = (effect: EffectCss, property: string) =>
  effect.declarations.find((declaration) => declaration.property === property)?.value;

/** The declarations of one rule in the stylesheet, by its exact selector line. */
function rule(css: string, selector: string): string {
  const start = css.indexOf(`${selector} {`);
  expect(start, `rule ${selector}`).toBeGreaterThanOrEqual(0);
  return css.slice(start, css.indexOf("}", start));
}

describe("button press", () => {
  test("lifts on hover and sinks while pressed, with a shadow change on each", () => {
    const css = effectStylesheet(generate({ lift: 4, press: 3 }), ".btn");
    expect(rule(css, ".btn:hover")).toContain("transform: translateY(-4px)");
    expect(rule(css, ".btn:active")).toContain("transform: translateY(3px)");
    const resting = value(generate(), "box-shadow");
    expect(rule(css, ".btn:hover")).toContain("box-shadow:");
    expect(rule(css, ".btn:hover")).not.toContain(`box-shadow: ${resting}`);
    expect(rule(css, ".btn:active")).not.toContain(`box-shadow: ${resting}`);
  });

  test("the lift distance deepens the hover shadow", () => {
    const shadow = (lift: number) => rule(effectStylesheet(generate({ lift }), ".btn"), ".btn:hover");
    expect(shadow(2)).not.toBe(shadow(10));
  });

  test("the base rule sets the color, a resting transform and a transition with the duration and easing", () => {
    const effect = generate({ duration: 220, easing: "spring" });
    expect(value(effect, "background-color")).toBe(defaults.fill);
    expect(value(effect, "transform")).toBe("translateY(0)");
    expect(value(effect, "transition")).toBe(
      `transform 220ms ${BUTTON_PRESS_EASINGS.spring}, box-shadow 220ms ${BUTTON_PRESS_EASINGS.spring}`,
    );
  });

  test("every easing choice has a valid timing function", () => {
    for (const timing of Object.values(BUTTON_PRESS_EASINGS)) {
      expect(timing).toMatch(/^(linear|cubic-bezier\(-?[\d.]+, -?[\d.]+, -?[\d.]+, -?[\d.]+\))$/);
    }
  });

  test("under reduced motion no transform or transition is applied", () => {
    const css = effectStylesheet(generate(), ".btn");
    const media = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(media).toContain("@media (prefers-reduced-motion: reduce)");
    // The rule covers the resting, hover and pressed states, so none of them moves.
    for (const selector of [".btn", ".btn:hover", ".btn:active"]) expect(media).toContain(selector);
    expect(media).toContain("transform: none;");
    expect(media).toContain("transition: none;");
    // It comes after the hover and pressed rules, so it wins at equal specificity.
    expect(css.indexOf("@media (prefers-reduced-motion: reduce)")).toBeGreaterThan(css.indexOf(".btn:active {"));
  });

  test("the label is readable on any button color", () => {
    for (const fill of ["#6366f1", "#facc15", "#111827", "#ffffff", "#ef4444"]) {
      const text = buttonPressText(fill);
      expect(contrastRatio(parseColor(text)!, parseColor(fill)!), fill).toBeGreaterThanOrEqual(4.4);
    }
  });

  test("stays a clean number with zero lift and zero press", () => {
    const css = effectStylesheet(generate({ lift: 0, press: 0 }), ".btn");
    expect(css).toContain("transform: translateY(0);");
    expect(css).not.toMatch(/undefined|NaN/);
  });
});
