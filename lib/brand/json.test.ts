import { describe, expect, test } from "vitest";

import { BRAND_JSON_VERSION, brandJson } from "@/lib/brand/json";
import { buildBrandTokens } from "@/lib/brand/tokens";
import { defaultSnapshot } from "@/lib/projects/snapshot";
import type { BrandProfile, BrandTokens } from "@/types/brand";

/** The default brand, built the same way `useBrandTokens()` builds the live one. */
function defaultBrand(profile?: Partial<BrandProfile>) {
  const snapshot = defaultSnapshot();
  const merged: BrandProfile = { ...snapshot.brand.profile, ...profile };
  const tokens = buildBrandTokens({
    profile: merged,
    swatches: snapshot.colors.swatches,
    gradient: snapshot.colors.gradient,
    headingFont: snapshot.typography.headingFont,
    bodyFont: snapshot.typography.bodyFont,
    catalog: [],
    rhythm: snapshot.typography.rhythm,
    scale: snapshot.typography.scale,
    radiusBase: snapshot.tokens.settings.radiusBase,
    spacingBase: snapshot.tokens.settings.spacingBase,
    shadowLayers: snapshot.effects.settings.shadow.layers,
  });
  return { tokens, voice: merged.voice, mission: merged.mission };
}

function serialize({ tokens, voice, mission }: { tokens: BrandTokens } & ReturnType<typeof defaultBrand>) {
  return brandJson(tokens, voice, mission);
}

describe("brandJson", () => {
  test("is valid JSON with the brand format and the current version", () => {
    const text = serialize(defaultBrand());
    const parsed = JSON.parse(text);

    expect(parsed.format).toBe("designhub.brand");
    expect(parsed.version).toBe(BRAND_JSON_VERSION);
    expect(text.endsWith("}\n")).toBe(true);
  });

  test("the same brand always gives the same text", () => {
    expect(serialize(defaultBrand())).toBe(serialize(defaultBrand()));
  });

  test("carries the colors of the default brand", () => {
    const brand = defaultBrand();
    const parsed = JSON.parse(serialize(brand));

    expect(parsed.name).toBe(brand.tokens.name);
    expect(parsed.description).toBe(brand.tokens.description);
    expect(parsed.colors.primary).toEqual(brand.tokens.colors.primary);
    expect(parsed.colors.secondary).toEqual(brand.tokens.colors.secondary);
    expect(parsed.colors.neutral).toEqual(brand.tokens.colors.neutrals);
    expect(parsed.colors.gradient).toBe(brand.tokens.gradient);
    expect(parsed.colors.palette).toHaveLength(brand.tokens.colors.all.length);
    for (const entry of parsed.colors.palette) {
      expect(Object.keys(entry).sort()).toEqual(["hex", "name", "role"]);
      expect(entry.hex).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  test("carries the typography of the default brand", () => {
    const { tokens } = defaultBrand();
    const parsed = JSON.parse(serialize(defaultBrand()));

    expect(parsed.typography.heading).toEqual({
      family: tokens.typography.heading,
      category: tokens.typography.headingCategory,
      weight: tokens.typography.headingWeight,
    });
    expect(parsed.typography.body).toEqual({
      family: tokens.typography.body,
      category: tokens.typography.bodyCategory,
      weight: tokens.typography.bodyWeight,
    });
    expect(parsed.typography.lineHeight).toEqual({
      heading: tokens.typography.headingLineHeight,
      body: tokens.typography.bodyLineHeight,
    });
    expect(Object.keys(parsed.typography.scale)).toEqual(tokens.typography.scale.map((step) => step.name));
    expect(Object.values(parsed.typography.scale)).toEqual(tokens.typography.scale.map((step) => step.clamp));
  });

  test("writes radius and spacing in pixels, and keeps the shadow", () => {
    const { tokens } = defaultBrand();
    const parsed = JSON.parse(serialize(defaultBrand()));

    expect(parsed.radius).toBe(`${tokens.radius}px`);
    expect(parsed.spacing).toBe(`${tokens.spacing}px`);
    expect(parsed.shadow).toBe(tokens.shadow);
  });

  test("carries the voice and the mission unchanged", () => {
    const brand = defaultBrand();
    const parsed = JSON.parse(serialize(brand));

    expect(parsed.voice).toEqual(brand.voice);
    expect(parsed.mission).toEqual(brand.mission);
  });

  test("marks the generated logo, and keeps an uploaded SVG logo as it is", () => {
    const generated = JSON.parse(serialize(defaultBrand()));
    expect(generated.logo.generated).toBe(true);
    expect(generated.logo.svg).toContain("<svg");

    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 0h10v10H0z"/></svg>';
    const uploaded = JSON.parse(serialize(defaultBrand({ logoSvg: svg })));
    expect(uploaded.logo).toEqual({ generated: false, svg });
  });

  test("serializes an uploaded logo and a very long name without throwing", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><title>${"Logo ".repeat(400)}</title></svg>`;
    const name = "Northwind Analytics Cooperative for Sustainable Data Systems ".repeat(20).trim();
    const brand = defaultBrand({ name, logoSvg: svg });

    const text = serialize(brand);
    const parsed = JSON.parse(text);

    expect(parsed.name).toBe(name);
    expect(parsed.logo.svg).toBe(svg);
  });

  test("escapes quotes, backslashes, line breaks and non-Latin text so the file still parses", () => {
    const name = 'Caf\u00e9 "Nord" \\ \u5317\u6b27';
    const description = "Line one\nLine two\ttabbed";
    const brand = defaultBrand({ name, description });

    const parsed = JSON.parse(serialize(brand));

    expect(parsed.name).toBe(name);
    expect(parsed.description).toBe(description);
  });
});
