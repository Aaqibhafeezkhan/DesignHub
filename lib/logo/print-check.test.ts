import { describe, expect, test } from "vitest";

import {
  distanceToUnset,
  inkFromRgba,
  MM_PER_POINT,
  measurePrintCheck,
  printCheckRasterWidth,
  printCheckVerdict,
  thinnestFeature,
  type InkBitmap,
} from "@/lib/logo/print-check";

/** A bitmap with filled rectangles, given as [x, y, width, height]. */
function bitmap(width: number, height: number, rects: [number, number, number, number][]): InkBitmap {
  const ink = new Uint8Array(width * height);
  for (const [x, y, w, h] of rects)
    for (let row = y; row < y + h; row += 1) ink.fill(1, row * width + x, row * width + x + w);
  return { width, height, ink };
}

describe("distanceToUnset", () => {
  test("measures the distance to the nearest unset pixel", () => {
    const mask = new Uint8Array([1, 1, 1, 1, 1, 0]);
    expect(Array.from(distanceToUnset(mask, 6, 1))).toEqual([5, 4, 3, 2, 1, 0]);
  });

  test("works in two dimensions", () => {
    const mask = new Uint8Array(25).fill(1);
    mask[0] = 0;
    const distances = distanceToUnset(mask, 5, 5);
    expect(distances[12]).toBeCloseTo(Math.hypot(2, 2), 4);
    expect(distances[0]).toBe(0);
  });
});

describe("thinnest stroke", () => {
  test("reports a thin line", () => {
    const thin = bitmap(120, 60, [[10, 28, 100, 3]]);
    expect(measurePrintCheck(thin, 20).stroke).toBeCloseTo(3, 0);
  });

  test("reports a thick bar as thicker than a thin one", () => {
    const thick = bitmap(120, 60, [[10, 20, 100, 14]]);
    const stroke = measurePrintCheck(thick, 30).stroke;
    expect(stroke).toBeGreaterThanOrEqual(13);
    expect(stroke).toBeLessThanOrEqual(15);
  });

  test("a bar wider than the search limit reports no thin stroke", () => {
    const thick = bitmap(120, 60, [[10, 20, 100, 30]]);
    expect(measurePrintCheck(thick, 10).stroke).toBe(Infinity);
  });

  test("finds the thinnest part of a logo that has thick and thin strokes", () => {
    const mixed = bitmap(160, 80, [
      [10, 10, 120, 12],
      [10, 40, 120, 3],
    ]);
    expect(measurePrintCheck(mixed, 30).stroke).toBeCloseTo(3, 0);
  });

  test("does not mistake a sharp point for a thin stroke", () => {
    const width = 100;
    const height = 60;
    const ink = new Uint8Array(width * height);
    // A solid triangle: its tip tapers to nothing but the body is wide.
    for (let y = 0; y < height; y += 1) {
      const span = Math.round((y / height) * 80);
      ink.fill(1, y * width + 10, y * width + 10 + span);
    }
    expect(measurePrintCheck({ width, height, ink }, 12).stroke).toBe(Infinity);
  });

  test("many sharp points together are still not a thin stroke", () => {
    const width = 120;
    const height = 40;
    const ink = new Uint8Array(width * height);
    // A row of sawteeth on a solid base: each tooth tapers to a point.
    for (let tooth = 0; tooth < 10; tooth += 1) {
      for (let y = 0; y < 20; y += 1) {
        const span = Math.round(((y + 1) / 20) * 12);
        const start = 5 + tooth * 11 + Math.round((12 - span) / 2);
        ink.fill(1, y * width + start, y * width + start + span);
      }
    }
    for (let y = 20; y < 36; y += 1) ink.fill(1, y * width + 5, y * width + 115);
    expect(measurePrintCheck({ width, height, ink }, 5).stroke).toBe(Infinity);
  });

  test("an empty bitmap has nothing to measure", () => {
    expect(measurePrintCheck(bitmap(40, 40, []), 10).stroke).toBe(Infinity);
    expect(thinnestFeature(new Uint8Array(0), 0, 0, 5)).toBe(Infinity);
  });
});

describe("thinnest gap", () => {
  test("finds a narrow gap between two solid bars", () => {
    const gapped = bitmap(120, 60, [
      [10, 10, 100, 16],
      [10, 29, 100, 16],
    ]);
    const { gap, stroke } = measurePrintCheck(gapped, 20);
    expect(gap).toBeCloseTo(3, 0);
    expect(stroke).toBeGreaterThanOrEqual(15);
  });

  test("ignores the open paper around the logo", () => {
    const bar = bitmap(120, 60, [[10, 20, 100, 16]]);
    expect(measurePrintCheck(bar, 20).gap).toBe(Infinity);
  });

  test("a wide gap is not flagged", () => {
    const apart = bitmap(160, 60, [
      [10, 10, 100, 12],
      [10, 40, 100, 12],
    ]);
    expect(measurePrintCheck(apart, 10).gap).toBe(Infinity);
  });
});

describe("verdict", () => {
  const pxPerMm = 10;

  test("fails a stroke thinner than the minimum and says so in words", () => {
    const minimum = 0.25 * MM_PER_POINT * 4;
    const verdict = printCheckVerdict({ stroke: 0.5, gap: Infinity }, pxPerMm, minimum);
    expect(verdict.pass).toBe(false);
    expect(verdict.strokeMm).toBeCloseTo(0.05, 5);
    expect(verdict.summary).toContain("thinnest stroke");
    expect(verdict.summary).toContain("fill in");
  });

  test("fails a thin gap", () => {
    const verdict = printCheckVerdict({ stroke: Infinity, gap: 0.4 }, pxPerMm, 0.1);
    expect(verdict.pass).toBe(false);
    expect(verdict.summary).toContain("close up");
  });

  test("passes when everything is wider than the minimum", () => {
    const verdict = printCheckVerdict({ stroke: 20, gap: Infinity }, pxPerMm, 0.1);
    expect(verdict.pass).toBe(true);
    expect(verdict.gapMm).toBeNull();
    expect(verdict.summary).toContain("2.00 mm");
  });

  test("a thin stroke in a small bitmap and a thick one in the same print size differ", () => {
    const thin = measurePrintCheck(bitmap(120, 60, [[10, 28, 100, 2]]), 20);
    const thick = measurePrintCheck(bitmap(120, 60, [[10, 20, 100, 14]]), 20);
    const minimum = 0.5;
    expect(printCheckVerdict(thin, 10, minimum).pass).toBe(false);
    expect(printCheckVerdict(thick, 10, minimum).pass).toBe(true);
  });
});

describe("raster helpers", () => {
  test("sizes the raster to resolve the minimum line and stays within limits", () => {
    expect(printCheckRasterWidth(40, 0.25 * MM_PER_POINT)).toBe(Math.round((40 * 2) / (0.25 * MM_PER_POINT)));
    expect(printCheckRasterWidth(1000, 0.05)).toBe(1600);
    expect(printCheckRasterWidth(1, 5)).toBe(200);
  });

  test("reads ink from the alpha channel", () => {
    const rgba = [0, 0, 0, 255, 0, 0, 0, 40, 0, 0, 0, 128, 255, 255, 255, 0];
    expect(Array.from(inkFromRgba(rgba, 4, 1).ink)).toEqual([1, 0, 1, 0]);
  });
});
