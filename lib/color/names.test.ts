import { describe, expect, test } from "vitest";

import { oklch } from "@/lib/color/color";
import { hueName, paletteNames } from "@/lib/color/names";

describe("hueName", () => {
  test.each([
    [0, "red"],
    [30, "orange"],
    [85, "yellow"],
    [140, "green"],
    [185, "teal"],
    [255, "blue"],
    [295, "violet"],
    [350, "pink"],
  ] as const)("names Oklch hue %i as %s", (h, name) => {
    expect(hueName(oklch(0.6, 0.2, h))).toBe(name);
  });

  test.each([
    [14.999, "red"],
    [15, "orange"],
    [359.999, "pink"],
    [360, "red"],
  ] as const)("names the hue boundary %f as %s", (h, name) => {
    expect(hueName({ l: 0.6, c: 0.2, h, alpha: 1 })).toBe(name);
  });

  test.each([
    [0, 0, "black"],
    [1, 0, "white"],
    [0.5, 0, "gray"],
    [0.1199, 0.02, "black"],
    [0.12, 0.02, "gray"],
    [0.1201, 0.02, "gray"],
    [0.9699, 0.02, "gray"],
    [0.97, 0.02, "gray"],
    [0.9701, 0.02, "white"],
    [0.5, 0.0299, "gray"],
    [0.5, 0.03, "blue"],
    [0.5, 0.0301, "blue"],
    [0.01, 0.03, "blue"],
    [0.99, 0.03, "blue"],
  ] as const)("names lightness %f and chroma %f as %s", (l, c, name) => {
    expect(hueName(oklch(l, c, 255))).toBe(name);
  });
});

describe("paletteNames", () => {
  test("returns no names for an empty palette", () => {
    expect(paletteNames([])).toEqual([]);
  });

  test("gives similar colors unique names in palette order", () => {
    expect(paletteNames([oklch(0.5, 0.15, 250), oklch(0.6, 0.2, 255), oklch(0.7, 0.1, 260)])).toEqual([
      "blue",
      "blue-2",
      "blue-3",
    ]);
  });

  test("counts interleaved hue and grayscale names independently", () => {
    const blue = oklch(0.6, 0.2, 255);
    const orange = oklch(0.6, 0.2, 30);
    const gray = oklch(0.5, 0, 90);
    const white = oklch(1, 0, 90);
    const black = oklch(0, 0, 90);

    expect(paletteNames([blue, orange, gray, blue, white, black, orange, gray, blue, white, black])).toEqual([
      "blue",
      "orange",
      "gray",
      "blue-2",
      "white",
      "black",
      "orange-2",
      "gray-2",
      "blue-3",
      "white-2",
      "black-2",
    ]);
  });

  test("starts the suffix count over for each palette", () => {
    const colors = [oklch(0.6, 0.2, 255), oklch(0.6, 0.2, 255)];

    expect(paletteNames(colors)).toEqual(["blue", "blue-2"]);
    expect(paletteNames(colors)).toEqual(["blue", "blue-2"]);
  });
});
