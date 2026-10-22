import { describe, expect, test } from "vitest";

import {
  computeFallbackOverrides,
  formatFallbackFontFace,
  systemFallbackFor,
  typographyFallbackCss,
} from "@/lib/typography/fallback";
import type { FontMetrics } from "@/lib/typography/fallback";

/** Capsize latin metrics for Poppins Regular. */
const poppins: FontMetrics = {
  ascent: 1050,
  descent: 350,
  lineGap: 100,
  unitsPerEm: 1000,
  avgCharWidth: 500,
};

/** Capsize latin metrics for Merriweather Regular. */
const merriweather: FontMetrics = {
  ascent: 1968,
  descent: 546,
  lineGap: 0,
  unitsPerEm: 2000,
  avgCharWidth: 970,
};

describe("computeFallbackOverrides", () => {
  test("matches known Poppins overrides against Arial", () => {
    const arial = systemFallbackFor("sans-serif");
    expect(arial.localName).toBe("Arial");
    const overrides = computeFallbackOverrides(poppins, arial.metrics.avgCharWidth);
    // size-adjust = 500 / 913
    expect(overrides.sizeAdjust).toBeCloseTo(500 / 913, 6);
    // ascent-override = 1050 / (1000 * size-adjust)
    expect(overrides.ascentOverride).toBeCloseTo(1050 / (1000 * (500 / 913)), 6);
    expect(overrides.descentOverride).toBeCloseTo(350 / (1000 * (500 / 913)), 6);
    expect(overrides.lineGapOverride).toBeCloseTo(100 / (1000 * (500 / 913)), 6);
  });

  test("matches known Merriweather overrides against Times New Roman", () => {
    const times = systemFallbackFor("serif");
    expect(times.localName).toBe("Times New Roman");
    const overrides = computeFallbackOverrides(merriweather, times.metrics.avgCharWidth);
    expect(overrides.sizeAdjust).toBeCloseTo(970 / 832, 6);
    expect(overrides.ascentOverride).toBeCloseTo(1968 / (2000 * (970 / 832)), 6);
    expect(overrides.descentOverride).toBeCloseTo(546 / (2000 * (970 / 832)), 6);
    expect(overrides.lineGapOverride).toBe(0);
  });
});

describe("formatFallbackFontFace", () => {
  test("emits @font-face with size-adjust and metric overrides for Arial", () => {
    const arial = systemFallbackFor("sans-serif");
    const overrides = computeFallbackOverrides(poppins, arial.metrics.avgCharWidth);
    const css = formatFallbackFontFace({
      familyName: "Poppins Fallback",
      localName: arial.localName,
      overrides,
    });
    expect(css).toContain('font-family: "Poppins Fallback";');
    expect(css).toContain('src: local("Arial");');
    expect(css).toMatch(/size-adjust:\s*[\d.]+%;/);
    expect(css).toMatch(/ascent-override:\s*[\d.]+%;/);
    expect(css).toMatch(/descent-override:\s*[\d.]+%;/);
    expect(css).toMatch(/line-gap-override:\s*[\d.]+%;/);
  });
});

describe("typographyFallbackCss", () => {
  test("documents the targeted system fonts in the export", () => {
    const css = typographyFallbackCss([
      { family: "Poppins", category: "sans-serif", metrics: poppins },
      { family: "Merriweather", category: "serif", metrics: merriweather },
    ]);
    expect(css).toContain("Arial");
    expect(css).toContain("Times New Roman");
    expect(css).toContain("Poppins Fallback");
    expect(css).toContain("Merriweather Fallback");
    expect(css).toContain('font-family: "Poppins", "Poppins Fallback"');
  });
});
