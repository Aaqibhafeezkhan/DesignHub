import { describe, expect, test } from "vitest";

import {
  detectBackground,
  extractCombinedPalette,
  extractPalette,
  hexOf,
  mergePixelSets,
} from "@/lib/brand-dna/palette";

const SIZE = 40;

/** A SIZE x SIZE RGBA image from a function of (x, y). */
function image(paint: (x: number, y: number) => [number, number, number, number?]): Uint8ClampedArray {
  const pixels = new Uint8ClampedArray(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const [r, g, b, a = 255] = paint(x, y);
      pixels.set([r, g, b, a], (y * SIZE + x) * 4);
    }
  }
  return pixels;
}

/** A red and blue logo mark in the middle of a white canvas. */
const logoOnWhite = image((x, y) => {
  const inMark = x >= 12 && x < 28 && y >= 12 && y < 28;
  if (!inMark) return [255, 255, 255];
  return y < 20 ? [229, 57, 53] : [30, 64, 175];
});

/** A full-bleed horizontal gradient: no flat background anywhere. */
const gradient = image((x) => [Math.round((x / SIZE) * 255), 80, 200]);

describe("detectBackground", () => {
  test("finds the white behind a logo", () => {
    const background = detectBackground(logoOnWhite, SIZE, SIZE);
    expect(background && hexOf(background)).toBe("#ffffff");
  });

  test("returns null for a full-bleed image", () => {
    expect(detectBackground(gradient, SIZE, SIZE)).toBeNull();
  });

  test("ignores transparent pixels", () => {
    expect(
      detectBackground(
        image(() => [0, 0, 0, 0]),
        SIZE,
        SIZE,
      ),
    ).toBeNull();
  });
});

describe("extractPalette", () => {
  test("without exclusion, white dominates a logo on white", () => {
    const palette = extractPalette(logoOnWhite, 5);
    expect(hexOf(palette[0]!.color)).toBe("#ffffff");
  });

  test("excluding the background leaves the logo colors, weighted as the whole image", () => {
    const background = detectBackground(logoOnWhite, SIZE, SIZE);
    const palette = extractPalette(logoOnWhite, 5, { exclude: background });
    const hexes = palette.map((item) => hexOf(item.color));
    expect(hexes).not.toContain("#ffffff");
    expect(hexes).toEqual(expect.arrayContaining(["#e53935", "#1e40af"]));
    const total = palette.reduce((sum, item) => sum + item.weight, 0);
    expect(total).toBeCloseTo(1, 5);
  });
});

describe("merging pixel sets", () => {
  const red = image(() => [229, 57, 53]);
  const blue = image(() => [30, 64, 175]);

  test("two equal images split the palette evenly", () => {
    const merged = mergePixelSets([{ pixels: red }, { pixels: blue }]);
    expect(merged).toHaveLength(2);
    expect(merged.map((item) => item.share)).toEqual([0.5, 0.5]);
  });

  test("weights each image by area, not by its sampled pixel count", () => {
    const palette = extractCombinedPalette([
      { pixels: red, weight: 3 },
      { pixels: blue, weight: 1 },
    ]);
    expect(palette.map((item) => hexOf(item.color))).toEqual(["#e53935", "#1e40af"]);
    expect(palette[0]!.weight).toBeCloseTo(0.75, 5);
    expect(palette[1]!.weight).toBeCloseTo(0.25, 5);
  });

  test("buckets shared by both images average their color", () => {
    const merged = mergePixelSets([{ pixels: image(() => [200, 0, 0]) }, { pixels: image(() => [202, 0, 0]) }]);
    expect(merged).toHaveLength(1);
    expect(merged[0]!.r).toBeCloseTo(201, 5);
    expect(merged[0]!.share).toBeCloseTo(1, 5);
  });

  test("each image keeps its own background exclusion", () => {
    const background = detectBackground(logoOnWhite, SIZE, SIZE);
    const white = image(() => [255, 255, 255]);
    const combined = extractCombinedPalette([{ pixels: logoOnWhite, exclude: background }, { pixels: white }]);
    // The logo's backdrop is dropped, but the second, plain white image still counts.
    expect(combined.map((item) => hexOf(item.color))).toEqual(
      expect.arrayContaining(["#ffffff", "#e53935", "#1e40af"]),
    );
    const logoOnly = extractCombinedPalette([{ pixels: logoOnWhite, exclude: background }]);
    expect(logoOnly.map((item) => hexOf(item.color))).not.toContain("#ffffff");
  });

  test("is deterministic and does not depend on input order", () => {
    const a = extractCombinedPalette([{ pixels: logoOnWhite }, { pixels: gradient }]);
    const b = extractCombinedPalette([{ pixels: logoOnWhite }, { pixels: gradient }]);
    const c = extractCombinedPalette([{ pixels: gradient }, { pixels: logoOnWhite }]);
    expect(b).toEqual(a);
    expect(c.map((item) => hexOf(item.color))).toEqual(a.map((item) => hexOf(item.color)));
  });

  test("attributes each bucket to the images it came from, by weighted share", () => {
    const merged = mergePixelSets([
      { id: "a", pixels: image(() => [200, 0, 0]), weight: 3 },
      { id: "b", pixels: image(() => [202, 0, 0]), weight: 1 },
      { id: "c", pixels: blue, weight: 1 },
    ]);
    const shared = merged.find((item) => item.r > 150)!;
    expect(shared.sources.map((source) => source.id)).toEqual(["a", "b"]);
    expect(shared.sources[0]!.share).toBeCloseTo(0.6, 5);
    expect(shared.sources[1]!.share).toBeCloseTo(0.2, 5);
    expect(shared.sources.reduce((sum, source) => sum + source.share, 0)).toBeCloseTo(shared.share, 5);
    expect(merged.find((item) => item.b > 150)!.sources).toEqual([{ id: "c", share: expect.closeTo(0.2, 5) }]);
  });

  test("palette colors list their source images, normalized per color", () => {
    const palette = extractCombinedPalette([
      { id: "a", pixels: red, weight: 3 },
      { id: "b", pixels: blue, weight: 1 },
      { id: "c", pixels: image(() => [231, 57, 53]), weight: 1 },
    ]);
    const redColor = palette.find((item) => hexOf(item.color).startsWith("#e"))!;
    expect(redColor.sources.map((source) => source.id)).toEqual(["a", "c"]);
    expect(redColor.sources[0]!.share).toBeCloseTo(0.75, 5);
    expect(redColor.sources[1]!.share).toBeCloseTo(0.25, 5);
    const blueColor = palette.find((item) => item !== redColor)!;
    expect(blueColor.sources).toEqual([{ id: "b", share: 1 }]);
  });

  test("dropping an image drops it from the attribution", () => {
    const sets = [
      { id: "a", pixels: red },
      { id: "b", pixels: blue },
    ];
    const both = extractCombinedPalette(sets);
    expect(both.flatMap((item) => item.sources.map((source) => source.id)).sort()).toEqual(["a", "b"]);
    const only = extractCombinedPalette(sets.slice(1));
    expect(only.flatMap((item) => item.sources.map((source) => source.id))).toEqual(["b"]);
  });

  test("a single set matches extractPalette", () => {
    expect(extractCombinedPalette([{ pixels: gradient }], 5)).toEqual(extractPalette(gradient, 5));
  });
});
