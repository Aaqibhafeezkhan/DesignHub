import { describe, expect, test } from "vitest";

import { gridGeometry, visibleRange } from "@/lib/windowing";

describe("gridGeometry", () => {
  test("fits as many tiles as the width allows and stretches them to fill it", () => {
    const { columns, tile, rowHeight } = gridGeometry(500, 64, 8);
    expect(columns).toBe(7);
    expect(tile * columns + 8 * (columns - 1)).toBeCloseTo(500);
    expect(rowHeight).toBeCloseTo(tile + 8);
  });

  test("has one column when the width is smaller than a tile, and a default before it is measured", () => {
    expect(gridGeometry(40, 64, 8).columns).toBe(1);
    expect(gridGeometry(0, 64, 8)).toEqual({ columns: 1, tile: 64, rowHeight: 72 });
  });
});

describe("visibleRange", () => {
  const base = { count: 1000, columns: 10, rowHeight: 70, overscan: 2 };

  test("draws only the rows in view and the overscan, not the whole list", () => {
    const { start, end } = visibleRange({ ...base, viewTop: 7000, viewBottom: 7800 });
    expect(start).toBe(98 * 10);
    expect(end - start).toBeLessThanOrEqual(10 * 16);
  });

  test("starts at the top and ends at the last item", () => {
    expect(visibleRange({ ...base, viewTop: 0, viewBottom: 500 }).start).toBe(0);
    expect(visibleRange({ ...base, viewTop: 69_000, viewBottom: 80_000 }).end).toBe(1000);
  });

  test("keeps the focused item even when it is far out of view", () => {
    const { start, end } = visibleRange({ ...base, viewTop: 0, viewBottom: 500, keep: 640 });
    expect(start).toBe(0);
    expect(end).toBeGreaterThan(640);
  });

  test("an empty list and a viewport past the end still give a valid range", () => {
    expect(visibleRange({ ...base, count: 0, viewTop: 0, viewBottom: 100 })).toEqual({ start: 0, end: 0 });
    const past = visibleRange({ ...base, count: 30, viewTop: 90_000, viewBottom: 91_000 });
    expect(past.end).toBe(30);
    expect(past.start).toBeLessThan(past.end);
  });
});
