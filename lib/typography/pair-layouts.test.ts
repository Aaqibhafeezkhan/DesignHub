import { describe, expect, test } from "vitest";

import { isPairLayout, pairLayouts, scaleSize } from "@/lib/typography/pair-layouts";
import { generateScale } from "@/lib/typography/scale";
import { defaultScale } from "@/store/typography-store";

describe("pair layouts", () => {
  test("lists the blog article, pricing card and landing hero", () => {
    expect([...pairLayouts]).toEqual(["article", "pricing", "hero"]);
    expect(isPairLayout("hero")).toBe(true);
    expect(isPairLayout("poster")).toBe(false);
  });

  test("scaleSize returns the live scale's clamp, or the fallback for a missing step", () => {
    const scale = generateScale(defaultScale);
    const base = scale.find((step) => step.name === "base")!;
    expect(scaleSize(scale, "base", "1rem")).toBe(base.clamp);
    expect(scaleSize(scale, "9xl", "3rem")).toBe("3rem");
    const short = generateScale({ ...defaultScale, stepsUp: 1 });
    expect(scaleSize(short, "5xl", "2rem")).toBe("2rem");
  });

  test("the scale changes the size", () => {
    const small = scaleSize(generateScale({ ...defaultScale, ratio: 1.125 }), "3xl", "x");
    const large = scaleSize(generateScale({ ...defaultScale, ratio: 1.5 }), "3xl", "x");
    expect(small).not.toBe(large);
  });
});
