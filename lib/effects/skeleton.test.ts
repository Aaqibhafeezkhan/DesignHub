import { describe, expect, test } from "vitest";

import { parseColor } from "@/lib/color/color";
import { effectStylesheet } from "@/lib/effects/css";
import { defaultEffectContext } from "@/lib/effects/define";
import { effectDefaults } from "@/lib/effects/defaults";
import { generateEffect } from "@/lib/effects/registry";
import { skeletonColors } from "@/lib/effects/skeleton";
import type { EffectCss, SkeletonSettings } from "@/types/effects";

const defaults = effectDefaults.skeleton;
const slate = { ...defaultEffectContext, neutrals: ["#0f172a", "#e2e8f0"] };

function generate(patch: Partial<SkeletonSettings> = {}, context = slate): EffectCss {
  return generateEffect("skeleton", { ...defaults, ...patch }, context)!;
}

const value = (effect: EffectCss, property: string) =>
  effect.declarations.find((declaration) => declaration.property === property)?.value;

describe("skeleton", () => {
  test("tints the brand's first neutral at the tone's lightness, keeping its hue", () => {
    const { base, highlight } = skeletonColors(defaults, slate);
    const neutral = parseColor("#0f172a")!;
    const block = parseColor(base)!;
    const shine = parseColor(highlight)!;
    expect(block.l).toBeCloseTo(0.92, 2);
    expect(shine.l).toBeGreaterThan(block.l);
    expect(block.h).toBeCloseTo(neutral.h, -1);
    expect(block.c).toBeLessThanOrEqual(0.026);
  });

  test("goes dark for dark pages and falls back to gray without a neutral", () => {
    const dark = skeletonColors({ ...defaults, tone: "dark" }, slate);
    expect(parseColor(dark.base)!.l).toBeLessThan(0.4);
    const gray = skeletonColors(defaults, defaultEffectContext);
    expect(parseColor(gray.base)!.c).toBeLessThan(0.001);
  });

  test("previews brand tints on a matching page, and custom colors on any backdrop", () => {
    expect(parseColor(generate().surface!)!.l).toBeGreaterThan(0.95);
    expect(parseColor(generate({ tone: "dark" }).surface!)!.l).toBeLessThan(0.25);
    expect(generate({ source: "custom" }).surface).toBeUndefined();
  });

  test("uses its own colors for the custom source", () => {
    expect(skeletonColors({ ...defaults, source: "custom", base: "#111111", highlight: "#222222" }, slate)).toEqual({
      base: "#111111",
      highlight: "#222222",
    });
  });

  test("sweeps a highlight band with the chosen angle, speed and radius", () => {
    const effect = generate({ source: "custom", base: "#e4e4e7", highlight: "#f4f4f5", angle: 75, speed: 2.5 });
    expect(value(effect, "background-color")).toBe("#e4e4e7");
    expect(value(effect, "background-image")).toBe("linear-gradient(75deg, #e4e4e7 40%, #f4f4f5 50%, #e4e4e7 60%)");
    expect(value(effect, "background-size")).toBe("300% 100%");
    expect(value(effect, "animation")).toBe("skeleton-shimmer 2.5s ease-in-out infinite");
    expect(value(generate({ radius: 4 }), "border-radius")).toBe("4px");
    expect(effect.global).toContain("@keyframes skeleton-shimmer");
  });

  test("shows a static block under reduced motion", () => {
    const css = effectStylesheet(generate(), ".skeleton");
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\) \{\s*\.skeleton \{\s*animation: none;\s*background-image: none;/,
    );
  });
});
