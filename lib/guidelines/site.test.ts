import { describe, expect, test } from "vitest";

import { brandSurface } from "@/lib/brand/theme";
import { buildBrandTokens } from "@/lib/brand/tokens";
import { colorDistance, contrastRatio, fromHex } from "@/lib/color/color";
import { formatRatio } from "@/lib/color/contrast";
import { effectTokens } from "@/lib/effects/bundle";
import {
  colorProportions,
  colorUsagePage,
  lowContrastPair,
  offPaletteColor,
  textCombinations,
} from "@/lib/guidelines/pages/color-usage";
import { introductionPage } from "@/lib/guidelines/pages/intro";
import {
  BODY_MIN_LINE_HEIGHT,
  typeHierarchy,
  typographyUsagePage,
  wrapToMeasure,
} from "@/lib/guidelines/pages/typography-usage";
import { fitGutter, gridColumns, spacingLayoutPage } from "@/lib/guidelines/pages/spacing-layout";
import { guidelinePages } from "@/lib/guidelines/registry";
import { brandSiteFiles, pageBlocks } from "@/lib/guidelines/site";
import type { GuidelineContext } from "@/lib/guidelines/types";
import { measureText } from "@/lib/logo/measure";
import { defaultSnapshot } from "@/lib/projects/snapshot";
import { xmlError } from "@/lib/test/xml";
import { buildTokens } from "@/lib/tokens/build";
import { generateScale } from "@/lib/typography/scale";
import type { BrandColor } from "@/types/brand";

/** The default brand as the guideline pages see it, built the way the hooks build it. */
function guidelineContext(name: string, excluded: string[], mode: "light" | "dark" = "light") {
  const { brand, colors, typography, tokens, effects, logo } = defaultSnapshot(name);
  const tokensForBrand = buildBrandTokens({
    profile: brand.profile,
    swatches: colors.swatches,
    gradient: colors.gradient,
    headingFont: typography.headingFont,
    bodyFont: typography.bodyFont,
    catalog: [],
    rhythm: typography.rhythm,
    scale: typography.scale,
    radiusBase: tokens.settings.radiusBase,
    spacingBase: tokens.settings.spacingBase,
    shadowLayers: effects.settings.shadow.layers,
  });
  const surface = brandSurface(tokensForBrand, mode);
  const pages = guidelinePages.filter((page) => !excluded.includes(page.id));
  const ctx: GuidelineContext = {
    brand: tokensForBrand,
    surface,
    mode,
    fontCss: "",
    measure: measureText,
    voice: brand.profile.voice,
    mission: brand.profile.mission,
    tokens: buildTokens(
      {
        colors: colors.swatches.map((swatch) => swatch.color),
        shadeOptions: colors.shadeOptions,
        gradient: colors.gradient,
        heading: undefined,
        body: undefined,
        scale: typography.scale,
        rhythm: typography.rhythm,
        effects: effectTokens(effects.settings),
      },
      { ...tokens.settings, name },
    ),
    logo: {
      logo: tokensForBrand.logo.svg,
      name,
      fontFamily: tokensForBrand.typography.heading,
      fontWeight: tokensForBrand.typography.headingWeight,
      fontCss: "",
      measure: (text, size) => measureText(text, tokensForBrand.typography.heading, 700, size),
      primary: surface.primary,
      text: surface.text,
      light: surface.background,
      dark: brandSurface(tokensForBrand, "dark").background,
    },
    clearSpace: logo.clearSpace,
    coverStyle: "gradient",
    date: "October 2026",
    contents: pages.map((page, i) => ({ id: page.id, title: page.title, number: i + 1 })),
  };
  return { ctx, pages };
}

function site(excluded: string[] = [], name = "Acme Labs") {
  const { ctx, pages } = guidelineContext(name, excluded);
  const files = new Map(brandSiteFiles(ctx, pages).map((entry) => [entry.name, String(entry.data)]));
  return { files, pages };
}

/** Resolves a relative href against the file that links to it. */
function resolve(from: string, href: string): string {
  const parts = from.split("/").slice(0, -1);
  for (const part of href.split("/")) {
    if (part === "..") parts.pop();
    else if (part !== ".") parts.push(part);
  }
  return parts.join("/");
}

describe("brand book website", () => {
  test("writes an index.html per included page and leaves switched-off pages out", () => {
    const { files, pages } = site(["imagery", "voice"]);
    const html = [...files.keys()].filter((name) => name.endsWith(".html"));
    expect(html).toHaveLength(pages.length + 1);
    expect(files.has("index.html")).toBe(true);
    expect(files.has("introduction/index.html")).toBe(true);
    expect(files.has("downloads/index.html")).toBe(true);
    expect(files.has("imagery/index.html")).toBe(false);
    expect(files.has("assets/pages/voice.svg")).toBe(false);
    expect(files.get("index.html")).not.toContain("Voice &amp; Tone");
  });

  test("every relative link and image points at a file in the ZIP", () => {
    const { files } = site();
    for (const [name, data] of files) {
      if (!name.endsWith(".html")) continue;
      for (const match of data.matchAll(/(?:href|src)="([^"#]+)"/g)) {
        const target = resolve(name, match[1]!);
        expect(files.has(target), `${name} links to ${match[1]}`).toBe(true);
      }
    }
  });

  test("pages carry their text as HTML headings and paragraphs", () => {
    const { files } = site([], `Tom & Jerry's "<Studio>"`);
    const mission = files.get("mission/index.html") ?? "";
    expect(mission.match(/<h1>/g)).toHaveLength(1);
    expect(mission).toContain("<h1>What Tom &amp; Jerry's &quot;&lt;Studio&gt;&quot; stands for</h1>");
    expect(mission).toContain("<h2>OUR MISSION</h2>");
    expect(mission).toContain('<html lang="en">');
    // The running header and footer are left to the site navigation.
    expect(mission).not.toContain("MISSION &amp; VALUES");
    expect(mission).toContain("<p>01 Craft</p>");
    for (const [name, data] of files) if (name.endsWith(".svg")) expect(xmlError(data), name).toBeNull();
  });
});

describe("co-branding page", () => {
  test("is in the site and its contents, with a placeholder partner, unless switched off", () => {
    const { files } = site();
    const page = files.get("co-branding/index.html") ?? "";
    expect(page).toContain("<h1>Co-branding</h1>");
    expect(page).toContain("<h2>DIVIDER</h2>");
    expect(page).toContain("<h2>SIZE BALANCE</h2>");
    expect(files.get("assets/pages/co-branding.svg")).toContain(">Partner</text>");
    expect(files.get("index.html")).toContain("Co-branding");

    const without = site(["co-branding"]).files;
    expect(without.has("co-branding/index.html")).toBe(false);
    expect(without.get("index.html")).not.toContain("Co-branding");
  });
});

/** The same context with another palette, as if it had been edited in Color Studio. */
function withPalette(ctx: GuidelineContext, all: BrandColor[]): GuidelineContext {
  return { ...ctx, brand: { ...ctx.brand, colors: { ...ctx.brand.colors, all } } };
}

describe("color usage page", () => {
  test("is in the site and its contents unless switched off", () => {
    const { files } = site();
    const page = files.get("color-usage/index.html") ?? "";
    expect(page).toContain("<h1>Color usage</h1>");
    expect(page).toContain("<h2>PROPORTIONS</h2>");
    expect(page).toContain("<h2>APPROVED TEXT ON COLOR</h2>");
    expect(page).toContain("<p>60% Dominant: Backgrounds, surfaces and body text</p>");
    expect(files.get("index.html")).toContain("Color Usage");

    const without = site(["color-usage"]).files;
    expect(without.has("color-usage/index.html")).toBe(false);
    expect(without.has("assets/pages/color-usage.svg")).toBe(false);
    expect(without.get("index.html")).not.toContain("Color Usage");
  });

  test("numbers the page after the palette and lists it in the contents", () => {
    const { ctx } = guidelineContext("Acme Labs", []);
    const palette = ctx.contents.find((entry) => entry.id === "color-palette");
    const usage = ctx.contents.find((entry) => entry.id === "color-usage");
    expect(usage?.number).toBe((palette?.number ?? 0) + 1);
    expect(introductionPage.render(ctx, 2)).toContain(">Color Usage</text>");
    const skipped = guidelineContext("Acme Labs", ["color-usage"]).ctx.contents;
    expect(skipped.find((entry) => entry.id === "typography")?.number).toBe(usage?.number);
  });

  test("splits 60 / 30 / 10 across the roles and hands a missing role to the neutrals", () => {
    const { ctx } = guidelineContext("Acme Labs", []);
    const shares = colorProportions(ctx);
    expect(shares.reduce((sum, group) => sum + group.share, 0)).toBe(100);
    const noSecondary = withPalette(ctx, [
      { id: "a", name: "Ink", hex: "#111827", role: "neutral" },
      { id: "b", name: "Ember", hex: "#e53935", role: "primary" },
    ]);
    expect(colorProportions(noSecondary).map((group) => [group.label, group.share])).toEqual([
      ["Dominant", 90],
      ["Accent", 10],
    ]);
  });

  test("shows only combinations that reach 4.5:1, with their real ratios, in light and dark", () => {
    for (const mode of ["light", "dark"] as const) {
      const { ctx } = guidelineContext("Acme Labs", [], mode);
      const combos = textCombinations(ctx);
      expect(combos.length).toBeGreaterThan(0);
      const svg = colorUsagePage.render(ctx, 10);
      expect(xmlError(svg)).toBeNull();
      for (const combo of combos) {
        const ratio = contrastRatio(fromHex(combo.foreground.hex), fromHex(combo.background.hex));
        expect(combo.ratio).toBeCloseTo(ratio, 6);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
        expect(svg).toContain(`>${formatRatio(ratio)}</text>`);
      }
    }
  });

  test("follows the live palette in its don'ts", () => {
    const { ctx } = guidelineContext("Acme Labs", []);
    const custom = withPalette(ctx, [
      { id: "a", name: "Ink", hex: "#111827", role: "neutral" },
      { id: "b", name: "Sun", hex: "#fbbf24", role: "secondary" },
      { id: "c", name: "Ember", hex: "#e53935", role: "primary" },
    ]);
    const low = lowContrastPair(custom);
    expect(low?.foreground.name).toBe("Ember");
    expect(low?.background.name).toBe("Sun");
    expect(low?.ratio).toBeLessThan(3);
    const foreign = fromHex(offPaletteColor(custom));
    for (const color of custom.brand.colors.all)
      expect(colorDistance(foreign, fromHex(color.hex))).toBeGreaterThan(0.1);
    expect(colorUsagePage.render(custom, 10)).toContain("Don't set text in Ember on Sun");
  });
});

describe("typography usage page", () => {
  test("is in the site and its contents unless switched off", () => {
    const { files } = site();
    const page = files.get("typography-usage/index.html") ?? "";
    expect(page).toContain("<h1>Typography usage</h1>");
    expect(page).toContain("<h2>HIERARCHY</h2>");
    expect(page).toContain("<h2>LINE LENGTH AND LINE HEIGHT</h2>");
    expect(page).toContain("<p>Don't set body text in all caps</p>");
    expect(files.get("index.html")).toContain("Typography Usage");

    const without = site(["typography-usage"]).files;
    expect(without.has("typography-usage/index.html")).toBe(false);
    expect(without.has("assets/pages/typography-usage.svg")).toBe(false);
    expect(without.get("index.html")).not.toContain("Typography Usage");
  });

  test("numbers the page after Typography and lists it in the contents", () => {
    const { ctx } = guidelineContext("Acme Labs", []);
    const typography = ctx.contents.find((entry) => entry.id === "typography");
    const usage = ctx.contents.find((entry) => entry.id === "typography-usage");
    expect(usage?.number).toBe((typography?.number ?? 0) + 1);
    expect(introductionPage.render(ctx, 2)).toContain(">Typography Usage</text>");
    const skipped = guidelineContext("Acme Labs", ["typography-usage"]).ctx.contents;
    expect(skipped.find((entry) => entry.id === "iconography")?.number).toBe(usage?.number);
  });

  test("builds the hierarchy from the type scale, largest first, without repeating a step", () => {
    const scale = generateScale({
      baseSize: 18,
      ratio: 1.25,
      minBase: 16,
      minRatio: 1.2,
      stepsUp: 2,
      stepsDown: 1,
      minViewport: 320,
      maxViewport: 1280,
    });
    const levels = typeHierarchy(scale);
    expect(levels.map((level) => level.role)).toEqual(["Heading 1", "Heading 2", "Body", "Small"]);
    expect(new Set(levels.map((level) => level.step.step)).size).toBe(levels.length);
    expect(levels.map((level) => level.step.step)).toEqual([2, 1, 0, -1]);
    const { ctx } = guidelineContext("Acme Labs", []);
    expect(typeHierarchy(ctx.brand.typography.scale).map((level) => level.role)).toEqual([
      "Display",
      "Heading 1",
      "Heading 2",
      "Heading 3",
      "Body",
      "Small",
    ]);
    expect(levels.find((level) => level.role === "Body")?.step.maxPx).toBe(18);
    for (const level of levels)
      if (level.font === "b") expect(level.lineHeight).toBeGreaterThanOrEqual(BODY_MIN_LINE_HEIGHT);
    expect(typeHierarchy([])).toEqual([]);
  });

  test("sets the line length sample to the ideal measure", () => {
    const lines = wrapToMeasure("one two three four five six seven eight nine ten", 14);
    expect(lines).toEqual(["one two three", "four five six", "seven eight", "nine ten"]);
    expect(wrapToMeasure("a reallylongwordthatcannotbreak b", 5)).toEqual(["a", "reallylongwordthatcannotbreak", "b"]);
  });

  test("draws sizes from the live scale in light and dark", () => {
    for (const mode of ["light", "dark"] as const) {
      const { ctx } = guidelineContext("Acme Labs", [], mode);
      const svg = typographyUsagePage.render(ctx, 12);
      expect(xmlError(svg)).toBeNull();
      expect(svg).toContain(`fill="${ctx.surface.background}"`);
      const body = ctx.brand.typography.scale.find((step) => step.step === 0);
      expect(svg).toContain(`${Math.round(body?.minPx ?? 0)}-${Math.round(body?.maxPx ?? 0)}px`);
    }
    const { ctx } = guidelineContext("Acme Labs", []);
    const bigger = {
      ...ctx,
      brand: {
        ...ctx.brand,
        typography: {
          ...ctx.brand.typography,
          scale: ctx.brand.typography.scale.map((step) => ({ ...step, minPx: step.minPx + 3, maxPx: step.maxPx + 7 })),
        },
      },
    };
    const top = bigger.brand.typography.scale.reduce((a, b) => (b.step > a.step ? b : a));
    expect(typographyUsagePage.render(bigger, 12)).toContain(`${Math.round(top.minPx)}-${Math.round(top.maxPx)}px`);
  });
});

describe("spacing and layout page", () => {
  test("is in the site and its contents unless switched off", () => {
    const { files } = site();
    const page = files.get("spacing-layout/index.html") ?? "";
    expect(page).toContain("<h1>Spacing and layout</h1>");
    expect(page).toContain("<h2>SPACING SCALE</h2>");
    expect(page).toContain("<h2>RADIUS SCALE</h2>");
    expect(page).toContain("<h2>12-COLUMN GRID</h2>");
    expect(files.get("index.html")).toContain("Spacing &amp; Layout");

    const without = site(["spacing-layout"]).files;
    expect(without.has("spacing-layout/index.html")).toBe(false);
    expect(without.has("assets/pages/spacing-layout.svg")).toBe(false);
    expect(without.get("index.html")).not.toContain("Spacing &amp; Layout");
  });

  test("numbers the page after Imagery and lists it in the contents", () => {
    const { ctx } = guidelineContext("Acme Labs", []);
    const imagery = ctx.contents.find((entry) => entry.id === "imagery");
    const layout = ctx.contents.find((entry) => entry.id === "spacing-layout");
    expect(layout?.number).toBe((imagery?.number ?? 0) + 1);
    expect(introductionPage.render(ctx, 2)).toContain(">Spacing &amp; Layout</text>");
    const skipped = guidelineContext("Acme Labs", ["spacing-layout"]).ctx.contents;
    expect(skipped.find((entry) => entry.id === "ui-components")?.number).toBe(layout?.number);
  });

  test("lays out twelve columns that fill the width, and keeps them visible with a huge gutter", () => {
    const columns = gridColumns(600, 24);
    expect(columns).toHaveLength(12);
    expect(columns[0]?.x).toBe(0);
    const last = columns[11];
    expect((last?.x ?? 0) + (last?.width ?? 0)).toBeCloseTo(600);
    expect((columns[1]?.x ?? 0) - (columns[0]?.width ?? 0)).toBeCloseTo(24);
    expect(fitGutter(600, 24)).toBe(24);
    expect(fitGutter(600, 500)).toBeLessThan(500);
    for (const column of gridColumns(600, 500)) expect(column.width).toBeGreaterThanOrEqual(8);
  });

  test("draws values from the live tokens in light and dark", () => {
    for (const mode of ["light", "dark"] as const) {
      const { ctx } = guidelineContext("Acme Labs", [], mode);
      const svg = spacingLayoutPage.render(ctx, 14);
      expect(xmlError(svg)).toBeNull();
      expect(svg).toContain(`fill="${ctx.surface.background}"`);
      expect(svg).toContain(`>${ctx.brand.spacing * 3}px (spacing-6)`.replace(">", ", gutter "));
      expect(svg).toContain(`>${Math.round(ctx.brand.radius * 2)}px</text>`);
    }
    const { ctx } = guidelineContext("Acme Labs", []);
    const custom = { ...ctx, brand: { ...ctx.brand, spacing: 10, radius: 6 } };
    const svg = spacingLayoutPage.render(custom, 14);
    expect(svg).toContain("gutter 30px (spacing-6)");
    expect(svg).toContain(">60px</text>");
    expect(svg).toContain(">12px</text>");
    const huge = spacingLayoutPage.render({ ...ctx, brand: { ...ctx.brand, spacing: 400 } }, 14);
    expect(xmlError(huge)).toBeNull();
    expect(huge).toContain("scaled down");
  });
});

describe("pageBlocks", () => {
  test("joins wrapped lines and items on one baseline", () => {
    const svg = `<svg>
      <text class="h" x="100" y="150" font-size="52" fill="#000">Title</text>
      <text class="bb" x="100" y="250" font-size="13" fill="#000" letter-spacing="2">LABEL</text>
      <text class="b" x="100" y="300" font-size="20" fill="#000">First line</text>
      <text class="b" x="100" y="330" font-size="20" fill="#000">second line &amp; more</text>
      <text class="bb" x="800" y="400" font-size="16" fill="#000">02</text>
      <text class="b" x="850" y="400" font-size="18" fill="#000">Mission</text>
      <text x="0" y="0" font-size="40">Logo text</text>
    </svg>`;
    expect(pageBlocks(svg)).toEqual([
      { tag: "h1", text: "Title" },
      { tag: "h2", text: "LABEL" },
      { tag: "p", text: "First line second line & more" },
      { tag: "p", text: "02 Mission" },
    ]);
  });
});
