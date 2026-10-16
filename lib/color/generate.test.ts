import { describe, expect, test } from "vitest";

import { fromHex, inGamut, toHex, toRgb } from "@/lib/color/color";
import { randomColor, randomPalette, type Random } from "@/lib/color/generate";
import type { Oklch } from "@/types/color";

/** A small seeded generator (mulberry32) so every run sees the same sequence. */
function seeded(seed: number): Random {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function expectValidOklch(color: Oklch) {
  expect(color.l).toBeGreaterThanOrEqual(0);
  expect(color.l).toBeLessThanOrEqual(1);
  expect(color.c).toBeGreaterThanOrEqual(0);
  expect(color.c).toBeLessThanOrEqual(0.4);
  expect(color.h).toBeGreaterThanOrEqual(0);
  expect(color.h).toBeLessThan(360);
  expect(color.alpha).toBe(1);
  for (const value of [color.l, color.c, color.h]) expect(Number.isFinite(value)).toBe(true);
}

function expectRgbInRange(color: Oklch) {
  const { r, g, b } = toRgb(color);
  for (const channel of [r, g, b]) {
    expect(Number.isInteger(channel)).toBe(true);
    expect(channel).toBeGreaterThanOrEqual(0);
    expect(channel).toBeLessThanOrEqual(255);
  }
}

describe("randomPalette", () => {
  test.each([0, 1, 2, 5, 10])("returns %i colors", (count) => {
    expect(randomPalette(count, seeded(1))).toHaveLength(count);
  });

  test("returns valid OKLCH values that convert to sRGB", () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      for (const color of randomPalette(8, seeded(seed))) {
        expectValidOklch(color);
        expectRgbInRange(color);
      }
    }
  });

  test("stays inside the sRGB gamut once converted to hex and back", () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      for (const color of randomPalette(8, seeded(seed))) {
        expect(inGamut(fromHex(toHex(color)), "srgb")).toBe(true);
      }
    }
  });

  test("gives the same palette for the same random function", () => {
    expect(randomPalette(6, seeded(42))).toEqual(randomPalette(6, seeded(42)));
  });

  test("gives a different palette for a different seed", () => {
    expect(randomPalette(6, seeded(42))).not.toEqual(randomPalette(6, seeded(43)));
  });

  test("spreads hues around the wheel by the golden angle", () => {
    // 0.99 keeps the optional deep-neutral step from replacing a color (needs random() < 0.5).
    const palette = randomPalette(3, () => 0.99);
    const step = (palette[1]!.h - palette[0]!.h + 360) % 360;
    expect(step).toBeCloseTo(137.508, 3);
  });

  test("never adds the deep neutral to palettes with fewer than four colors", () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      for (const color of randomPalette(3, seeded(seed))) expect(color.l).toBeGreaterThan(0.29);
    }
  });
});

describe("randomColor", () => {
  test("returns a valid OKLCH color that converts to sRGB", () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      const color = randomColor(seeded(seed));
      expectValidOklch(color);
      expectRgbInRange(color);
    }
  });

  test("gives the same color for the same random function", () => {
    expect(randomColor(seeded(7))).toEqual(randomColor(seeded(7)));
  });

  test("keeps a hue that is passed in", () => {
    expect(randomColor(seeded(7), 200).h).toBe(200);
  });
});
