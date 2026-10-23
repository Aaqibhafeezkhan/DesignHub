import { describe, expect, test } from "vitest";

import { effectsBundle } from "@/lib/effects/bundle";
import { tailwindUtility, effectStylesheet } from "@/lib/effects/css";
import { cardTilt, tiltSnippet, TILT_PROPERTIES } from "@/lib/effects/card-tilt";
import { effectDefaults } from "@/lib/effects/defaults";
import { generateEffect } from "@/lib/effects/registry";
import { hasReducedMotionRule, motionIn } from "@/lib/a11y/motion";
import type { CardTiltSettings, EffectCss } from "@/types/effects";

const defaults = effectDefaults["card-tilt"];
const generate = (patch: Partial<CardTiltSettings> = {}): EffectCss =>
  generateEffect("card-tilt", { ...defaults, ...patch })!;

describe("card tilt", () => {
  test("tilts on hover with fallbacks, so it works with no script", () => {
    const css = effectStylesheet(generate({ maxTilt: 12, perspective: 900 }), ".card");
    expect(css).toContain(".card:hover {");
    expect(css).toContain("perspective(900px) rotateX(var(--tilt-x, 12deg)) rotateY(var(--tilt-y, -12deg))");
    expect(css).toContain("var(--glare-x, 30%) var(--glare-y, 20%)");
  });

  test("the resting transform has a transition to animate from", () => {
    const effect = generate({ duration: 250 });
    const value = (property: string) => effect.declarations.find((item) => item.property === property)?.value;
    expect(value("transform")).toBe("perspective(800px) rotateX(0deg) rotateY(0deg)");
    expect(value("transition")).toContain("transform 250ms");
  });

  test("applies no transform under reduced motion", () => {
    const css = effectStylesheet(generate(), ".card");
    const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(reduced).toMatch(/\.card,\s*\.card:hover \{\s*transform: none;\s*transition: none;/);
    expect(motionIn(css)).toBe("Transform transition");
    expect(hasReducedMotionRule(css)).toBe(true);
  });

  test("the snippet sets and clears every custom property the CSS reads", () => {
    const snippet = tiltSnippet(10);
    for (const name of TILT_PROPERTIES) expect(snippet).toContain(`"${name}"`);
    expect(snippet).toContain("removeProperty");
    expect(snippet).not.toContain("*/");
    const css = effectStylesheet(generate(), ".card");
    expect(css).toContain("Optional: follow the pointer");
  });

  test("exports as a utility and in the bundle", () => {
    expect(tailwindUtility("fx-card-tilt", cardTilt.generate(defaults))).toContain("&:hover {");
    expect(effectsBundle(effectDefaults)).toContain("/* Card tilt */\n.fx-card-tilt {");
  });
});
