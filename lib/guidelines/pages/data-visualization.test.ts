import { describe, expect, test } from "vitest";

import { fromHex, parseColor } from "@/lib/color/color";
import {
  categoricalColors,
  dataVisualizationPage,
  divergingRamp,
  MIN_SERIES_DISTANCE,
  sequentialRamp,
  SERIES,
  seriesSeparation,
  worstDistance,
} from "@/lib/guidelines/pages/data-visualization";
import { guidelineContext } from "@/lib/guidelines/test-context";
import { brandSiteFiles } from "@/lib/guidelines/site";
import { xmlError } from "@/lib/test/xml";

const lightness = (hex: string) => parseColor(hex)!.l;

describe("data visualization colors", () => {
  test("gives six distinct series colors that lead with the primary", () => {
    for (const mode of ["light", "dark"] as const) {
      const { ctx } = guidelineContext("Acme Labs", [], mode);
      const colors = categoricalColors(ctx);
      expect(colors).toHaveLength(SERIES);
      expect(colors[0]!.hex.toLowerCase()).toBe(ctx.surface.primary.toLowerCase());
      expect(new Set(colors.map((color) => color.hex)).size).toBe(SERIES);
    }
  });

  test("keeps every pair apart under all three kinds of color blindness", () => {
    const { ctx } = guidelineContext("Acme Labs", []);
    expect(seriesSeparation(categoricalColors(ctx))).toBeGreaterThanOrEqual(MIN_SERIES_DISTANCE);
  });

  test("worstDistance is the smallest distance across the vision types", () => {
    const red = fromHex("#d62728");
    const green = fromHex("#2ca02c");
    expect(worstDistance(red, green)).toBeLessThan(worstDistance(red, fromHex("#1f77b4")));
    expect(worstDistance(red, red)).toBe(0);
  });

  test("the sequential ramp gets steadily darker", () => {
    const { ctx } = guidelineContext("Acme Labs", []);
    const ramp = sequentialRamp(ctx);
    expect(ramp).toHaveLength(7);
    ramp.slice(1).forEach((hex, i) => expect(lightness(hex)).toBeLessThan(lightness(ramp[i]!)));
  });

  test("the diverging ramp is lightest in the middle and mirrors in lightness", () => {
    const { ctx } = guidelineContext("Acme Labs", []);
    const ramp = divergingRamp(ctx);
    expect(ramp).toHaveLength(7);
    const middle = lightness(ramp[3]!);
    ramp.forEach((hex, i) => i !== 3 && expect(lightness(hex)).toBeLessThan(middle));
    expect(lightness(ramp[0]!)).toBeCloseTo(lightness(ramp[6]!), 1);
    expect(parseColor(ramp[0]!)!.h).not.toBeCloseTo(parseColor(ramp[6]!)!.h, 0);
  });
});

describe("data visualization page", () => {
  test("renders well-formed SVG in light and dark, and appears in the website export", () => {
    for (const mode of ["light", "dark"] as const) {
      const { ctx } = guidelineContext("Acme Labs", [], mode);
      expect(xmlError(dataVisualizationPage.render(ctx, 11))).toBeNull();
    }
    const { ctx, pages } = guidelineContext("Acme Labs", []);
    const files = new Map(brandSiteFiles(ctx, pages).map((entry) => [entry.name, String(entry.data)]));
    expect(files.get("data-visualization/index.html")).toContain("<h1>Data Visualization</h1>");
  });

  test("can be switched off and the numbering closes up", () => {
    const { ctx } = guidelineContext("Acme Labs", ["data-visualization"]);
    expect(ctx.contents.some((entry) => entry.id === "data-visualization")).toBe(false);
    expect(ctx.contents.map((entry) => entry.number)).toEqual(ctx.contents.map((_, i) => i + 1));
  });
});
