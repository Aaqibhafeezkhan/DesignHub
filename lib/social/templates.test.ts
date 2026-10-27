import { describe, expect, test } from "vitest";

import { allMockupTemplates as mockupTemplates } from "@/lib/mockups/all";
import { mockupCategories } from "@/lib/mockups/types";
import { watchFace, watchNotification } from "@/lib/mockups/templates/smartwatch";
import { storeCaptions, captionLines } from "@/lib/mockups/templates/app-store";
import { landingNav } from "@/lib/mockups/templates/laptop-landing";
import { notebookCopy, NOTEBOOK_TEXT_WIDTH } from "@/lib/mockups/templates/notebook";
import {
  SLIDE_TITLE_LINES,
  SLIDE_TITLE_WIDTH,
  slideSizes,
  slideTitleLines,
} from "@/lib/mockups/templates/presentation";
import { BOOTH, boothCopy } from "@/lib/mockups/templates/trade-show-booth";
import { VAN, vanCopy } from "@/lib/mockups/templates/delivery-van";
import type { MockupContext } from "@/lib/mockups/types";
import { allSocialTemplates as socialTemplates } from "@/lib/social/all";
import type { SocialContext } from "@/lib/social/types";
import { mockupContext, socialContext } from "@/lib/test/draw-context";
import { rootSize, xmlError } from "@/lib/test/xml";
import type { BrandMode } from "@/types/brand";

const getTemplate = (id: string) => mockupTemplates.find((template) => template.id === id);
const modes: BrandMode[] = ["light", "dark"];
// Characters that must be escaped, to catch text written into the SVG unescaped.
const trickyName = `Tom & Jerry's "<Studio>"`;

// Both suites loop over the registries, so new templates are covered as soon as they are registered.
describe.each(socialTemplates.map((template) => [template.id, template] as const))("social %s", (_id, template) => {
  test.each(modes)("renders well-formed XML at the platform size (%s)", (mode) => {
    const svg = template.render(socialContext(mode));
    expect(xmlError(svg)).toBeNull();
    const size = rootSize(svg);
    expect(size.tag).toBe("svg");
    expect(size.width).toBe(template.width);
    expect(size.height).toBe(template.height);
    expect(size.viewBox).toEqual([0, 0, template.width, template.height]);
  });

  test("escapes the brand name", () => {
    expect(xmlError(template.render(socialContext("light", trickyName)))).toBeNull();
  });
});

type TextBox = { value: string; start: number; end: number; baseline: number };

/**
 * The horizontal extent of every top-level `<text>` in a drawing, measured the way the
 * templates measure (ctx.measure, plus letter-spacing). Follows `translate()` groups and
 * skips nested `<svg>` documents such as the logo.
 */
function textBoxes(ctx: SocialContext, svg: string): TextBox[] {
  const unescape = (value: string) =>
    value
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&");
  const attr = (attrs: string, name: string) => attrs.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
  const boxes: TextBox[] = [];
  // Each open element pushes its x offset, or null inside a nested document.
  const stack: (number | null)[] = [];
  const tag = /<(\/?)([A-Za-z][\w:-]*)([^>]*?)(\/?)>/g;
  for (let match = tag.exec(svg); match; match = tag.exec(svg)) {
    const [, closing, name, attrs = "", selfClosing] = match;
    if (closing) {
      stack.pop();
      continue;
    }
    const parent = stack.length ? stack[stack.length - 1]! : 0;
    const nested = parent === null || (name === "svg" && stack.length > 0);
    const translate = attr(attrs, "transform")?.match(/^translate\(([-\d.]+)/);
    const offset = nested ? null : (parent ?? 0) + (translate ? Number(translate[1]) : 0);
    if (name === "text" && offset !== null) {
      const close = svg.indexOf("</text>", tag.lastIndex);
      const value = unescape(svg.slice(tag.lastIndex, close));
      const size = Number(attr(attrs, "font-size"));
      const font = attr(attrs, "class");
      const { heading, headingWeight, body } = ctx.brand.typography;
      const family = font === "h" ? heading : font ? body : (attr(attrs, "font-family") ?? body);
      const weight = font === "h" ? headingWeight : font === "bb" ? 600 : Number(attr(attrs, "font-weight") ?? 400);
      const width =
        ctx.measure(value, family, weight, size) + Number(attr(attrs, "letter-spacing") ?? 0) * value.length;
      const x = offset + Number(attr(attrs, "x"));
      const anchor = attr(attrs, "text-anchor") ?? "start";
      const start = anchor === "middle" ? x - width / 2 : anchor === "end" ? x - width : x;
      boxes.push({ value, start, end: start + width, baseline: Number(attr(attrs, "y")) });
      tag.lastIndex = close + "</text>".length;
      continue;
    }
    if (!selfClosing) stack.push(offset);
  }
  return boxes;
}

describe("long single-word links", () => {
  const word = "northwindanalyticscooperativeforsustainabledatasystems";
  const long = {
    name: "Northwind Analytics Cooperative for Sustainable Data Systems",
    website: `${word}.co.uk`,
    handle: `@${word}teams`,
    github: `${word}studio`,
  };

  function longContext(mode: BrandMode): SocialContext {
    const ctx = socialContext(mode, long.name);
    return { ...ctx, content: { ...ctx.content, ...long } };
  }

  test("the sample values are 60 characters", () => {
    for (const value of Object.values(long)) expect(value).toHaveLength(60);
  });

  test.each(socialTemplates.map((template) => [template.id, template] as const))(
    "%s keeps the website and handle inside the safe area",
    (_id, template) => {
      for (const mode of modes) {
        const ctx = longContext(mode);
        const boxes = textBoxes(ctx, template.render(ctx));
        // Any text that shows part of a link, even shortened with an ellipsis.
        const links = boxes.filter((box) =>
          [long.website, long.handle, long.github].some((value) => box.value.includes(value.slice(0, 12))),
        );
        for (const box of links) {
          expect(box.start, box.value).toBeGreaterThanOrEqual(template.safe.x - 0.5);
          expect(box.end, box.value).toBeLessThanOrEqual(template.safe.x + template.safe.width + 0.5);
        }
      }
    },
  );

  test.each(socialTemplates.map((template) => [template.id, template] as const))(
    "%s keeps text off the covered zones",
    (_id, template) => {
      for (const mode of modes) {
        const ctx = longContext(mode);
        for (const box of textBoxes(ctx, template.render(ctx))) {
          for (const zone of template.covered ?? []) {
            const inside = box.baseline > zone.y && box.baseline < zone.y + zone.height;
            const overlaps = box.end > zone.x && box.start < zone.x + zone.width;
            expect(inside && overlaps, box.value).toBe(false);
          }
        }
      }
    },
  );

  test.each(socialTemplates.map((template) => [template.id, template] as const))(
    "%s draws short links in full",
    (_id, template) => {
      const ctx = socialContext("light");
      const svg = template.render(ctx);
      for (const value of [ctx.content.website, ctx.content.handle]) {
        const shown = textBoxes(ctx, svg).some((box) => box.value.includes(value));
        // Not every template shows both, but none shortens a short one.
        if (svg.includes(value.slice(0, 6))) expect(shown, value).toBe(true);
      }
    },
  );
});

describe.each(mockupTemplates.map((template) => [template.id, template] as const))("mockup %s", (_id, template) => {
  test.each(modes)("renders well-formed XML with a matching size and viewBox (%s)", (mode) => {
    const svg = template.render(mockupContext(mode));
    expect(xmlError(svg)).toBeNull();
    const size = rootSize(svg);
    expect(size.tag).toBe("svg");
    expect(Number.isInteger(size.width) && size.width > 0).toBe(true);
    expect(Number.isInteger(size.height) && size.height > 0).toBe(true);
    expect(size.viewBox).toEqual([0, 0, size.width, size.height]);
  });

  test("escapes the brand name", () => {
    expect(xmlError(template.render(mockupContext("light", trickyName)))).toBeNull();
  });
});

test("the browser tab draws the app icon favicon at 16 px in the tab, the 1x callout and the 2x zoom", () => {
  const svg = getTemplate("browser-tab")!.render(mockupContext("light"));
  const favicons = svg.match(/<svg[^>]* width="16" height="16" viewBox="0 0 512 512"/g) ?? [];
  expect(favicons).toHaveLength(3);
});

test("the lock screen draws the app icon variant in both notifications", () => {
  const svg = getTemplate("lock-screen")!.render(mockupContext("dark"));
  const icons = svg.match(/<svg[^>]* width="40" height="40" viewBox="0 0 512 512"/g) ?? [];
  expect(icons).toHaveLength(2);
});

describe("app store screenshots", () => {
  const long = "Plan every launch from one calm place with your whole team and never miss a deadline again, ever";

  test("draws three phones, each with a caption above it", () => {
    const ctx = mockupContext("light");
    const svg = getTemplate("app-store")!.render(ctx);
    expect(svg.match(/<clipPath id="phone-/g)).toHaveLength(3);
    for (const caption of storeCaptions(ctx)) expect(svg).toContain(caption.slice(0, 8));
  });

  test("captions come from the copy fields and fall back to the brand", () => {
    const ctx = mockupContext("light", "Acme");
    expect(storeCaptions({ ...ctx, content: { ...ctx.content, headline: "", cta: "", role: "" } })).toEqual([
      "Welcome to Acme",
      "Get started",
      "Made for you",
    ]);
    expect(storeCaptions({ ...ctx, content: { ...ctx.content, headline: "Ship faster" } })[0]).toBe("Ship faster");
  });

  test("a long caption wraps to at most three lines that fit the column", () => {
    for (const mode of modes) {
      const ctx = mockupContext(mode);
      const lines = captionLines(ctx, long);
      expect(lines.length).toBeLessThanOrEqual(3);
      for (const line of lines) {
        expect(ctx.measure(line, ctx.brand.typography.heading, ctx.brand.typography.headingWeight, 40)).toBeLessThan(
          488 + 1,
        );
      }
    }
    expect(captionLines(mockupContext("light"), "x".repeat(200))).toHaveLength(1);
  });

  test("renders the brand colors in both themes", () => {
    for (const mode of modes) {
      const ctx = mockupContext(mode);
      expect(getTemplate("app-store")!.render(ctx)).toContain(`stop-color="${ctx.surface.primary}"`);
    }
  });
});

describe("smartwatch", () => {
  test("draws two watches, the face and a notification, with the brand mark in each", () => {
    const svg = getTemplate("smartwatch")!.render(mockupContext("dark"));
    expect(svg.match(/<clipPath id="watch-/g)).toHaveLength(2);
    expect(svg).toContain("9:41");
    expect(svg).toContain(`stop-color`);
  });

  test("a long brand name, message and button label are shortened to the watch display", () => {
    for (const mode of modes) {
      const ctx = mockupContext(mode, "Northwind Analytics Cooperative for Sustainable Data Systems");
      const long = {
        ...ctx,
        content: { ...ctx.content, headline: "word ".repeat(60), cta: "Open the whole dashboard right now" },
      };
      const { typography } = long.brand;
      for (const svg of [watchFace(long), watchNotification(long)]) {
        const texts = [...svg.matchAll(/<text class="(h|b|bb)"[^>]*font-size="(\d+)"[^>]*>([^<]*)<\/text>/g)];
        expect(texts.length).toBeGreaterThan(2);
        for (const [, font, size, value] of texts) {
          const family = font === "h" ? typography.heading : typography.body;
          const weight = font === "h" ? typography.headingWeight : font === "bb" ? 600 : 400;
          expect(long.measure(value!, family, weight, Number(size)), value).toBeLessThanOrEqual(208);
        }
      }
    }
  });
});

describe("landing page nav", () => {
  const sixty = "Northwind Analytics Cooperative for Sustainable Data Systems";
  const boxes = (nav: ReturnType<typeof landingNav>) =>
    [nav.name, ...nav.links, nav.cta].map((box) => ({ start: box.x, end: box.x + box.width }));

  test("a 60 character name never overlaps the links or the button", () => {
    expect(sixty).toHaveLength(60);
    for (const mode of modes) {
      for (const width of [1440, 1024, 800]) {
        const ctx = mockupContext(mode, sixty);
        const nav = landingNav(ctx, width);
        const sorted = boxes(nav);
        for (let i = 1; i < sorted.length; i++)
          expect(sorted[i]!.start, `${width}`).toBeGreaterThan(sorted[i - 1]!.end);
        expect(
          ctx.measure(nav.name.text, ctx.brand.typography.heading, ctx.brand.typography.headingWeight, nav.name.size),
        ).toBeCloseTo(nav.name.width);
      }
    }
  });

  test("names from 3 to 60 characters fit at the laptop size, and short names keep every link", () => {
    for (let length = 3; length <= 60; length++) {
      const nav = landingNav(mockupContext("light", sixty.slice(0, length).trim()), 1440);
      const sorted = boxes(nav);
      for (let i = 1; i < sorted.length; i++) expect(sorted[i]!.start, `${length}`).toBeGreaterThan(sorted[i - 1]!.end);
      if (length <= 12) expect(nav.links).toHaveLength(4);
    }
  });

  test("the rendered page draws the nav the layout computed", () => {
    const ctx = mockupContext("dark", sixty);
    const nav = landingNav(ctx, 1440);
    const svg = getTemplate("laptop-landing")!.render(ctx);
    for (const link of ["Product", "Pricing", "Docs", "Company"]) {
      expect(svg.includes(`>${link}</text>`)).toBe(nav.links.some((item) => item.label === link));
    }
  });
});

describe.each(["notion-cover", "medium-banner"])("%s with very short and very long names", (id) => {
  const template = socialTemplates.find((item) => item.id === id)!;

  test.each([
    ["3 character", "Axe"],
    ["60 character", "Northwind Analytics Cooperative for Sustainable Data Systems"],
  ])("a %s name stays inside the safe area", (_label, name) => {
    for (const mode of modes) {
      const ctx = socialContext(mode, name);
      for (const box of textBoxes(ctx, template.render(ctx))) {
        expect(box.start, box.value).toBeGreaterThanOrEqual(template.safe.x - 0.5);
        expect(box.end, box.value).toBeLessThanOrEqual(template.safe.x + template.safe.width + 0.5);
      }
    }
  });
});

describe("Buy Me a Coffee cover", () => {
  const template = socialTemplates.find((item) => item.id === "buy-me-a-coffee-cover")!;

  test.each([
    ["long words", "Plan every launch from one calm place with your whole team and never miss a deadline again, ever"],
    ["one long word", "supercalifragilisticexpialidocious".repeat(5)],
  ])("a %s headline stays inside the safe area", (_label, headline) => {
    for (const mode of modes) {
      const base = socialContext(mode, "Northwind Analytics Cooperative for Sustainable Data Systems");
      const ctx: SocialContext = {
        ...base,
        content: { ...base.content, headline, cta: "Support the team with a coffee" },
      };
      for (const box of textBoxes(ctx, template.render(ctx))) {
        expect(box.start, box.value).toBeGreaterThanOrEqual(template.safe.x - 0.5);
        expect(box.end, box.value).toBeLessThanOrEqual(template.safe.x + template.safe.width + 0.5);
      }
    }
  });

  test("draws the call to action as the support button", () => {
    const base = socialContext("light");
    const ctx = { ...base, content: { ...base.content, cta: "Treat me to a coffee" } };
    expect(template.render(ctx)).toContain("Treat me to a coffee");
  });
});

describe("Ghost publication cover", () => {
  const template = socialTemplates.find((item) => item.id === "ghost-cover")!;

  test.each([
    ["3 character", "Axe"],
    ["60 character", "Northwind Analytics Cooperative for Sustainable Data Systems"],
  ])("a %s name stays inside the safe area", (_label, name) => {
    for (const mode of modes) {
      const ctx = socialContext(mode, name);
      for (const box of textBoxes(ctx, template.render(ctx))) {
        expect(box.start, box.value).toBeGreaterThanOrEqual(template.safe.x - 0.5);
        expect(box.end, box.value).toBeLessThanOrEqual(template.safe.x + template.safe.width + 0.5);
      }
    }
  });

  test.each([
    ["long words", "Plan every launch from one calm place with your whole team and never miss a deadline again, ever"],
    ["one long word", "supercalifragilisticexpialidocious".repeat(5)],
  ])("a %s description stays inside the safe area", (_label, headline) => {
    for (const mode of modes) {
      const base = socialContext(mode);
      const ctx: SocialContext = { ...base, content: { ...base.content, headline } };
      for (const box of textBoxes(ctx, template.render(ctx))) {
        expect(box.start, box.value).toBeGreaterThanOrEqual(template.safe.x - 0.5);
        expect(box.end, box.value).toBeLessThanOrEqual(template.safe.x + template.safe.width + 0.5);
      }
    }
  });

  test("draws the publication name and description", () => {
    const base = socialContext("dark");
    const ctx: SocialContext = {
      ...base,
      content: { ...base.content, name: "The Slow Draft", headline: "Notes on building calm software" },
    };
    const svg = template.render(ctx);
    expect(svg).toContain("The Slow Draft");
    expect(svg).toContain("Notes on building calm software");
  });
});

describe("long copy on the newer print and screen mockups", () => {
  const sixty = "Northwind Analytics Cooperative for Sustainable Data Systems";
  const word = "northwindanalyticscooperativeforsustainabledatasystems.co.uk";
  const phone = "+44 (0) 20 7946 0958 extension 12345 and then some more";
  const headline = `${sixty} and a headline that keeps going well past any sensible length for a slide`;

  function longContext(mode: BrandMode): MockupContext {
    const ctx = mockupContext(mode, sixty);
    return { ...ctx, content: { ...ctx.content, headline, website: word, phone } };
  }

  const width = (ctx: MockupContext, value: string, size: number, font: "h" | "bb" | "b") => {
    const { heading, headingWeight, body } = ctx.brand.typography;
    return ctx.measure(
      value,
      font === "h" ? heading : body,
      font === "h" ? headingWeight : font === "bb" ? 600 : 400,
      size,
    );
  };

  test("the notebook shortens a 60 character name and a long website instead of clipping them", () => {
    expect(sixty).toHaveLength(60);
    for (const mode of modes) {
      const ctx = longContext(mode);
      const copy = notebookCopy(ctx);
      expect(copy.name.endsWith("...")).toBe(true);
      expect(width(ctx, copy.name, 46, "h") + 2 * copy.name.length).toBeLessThanOrEqual(NOTEBOOK_TEXT_WIDTH);
      expect(width(ctx, copy.website, 24, "bb") + 2 * copy.website.length).toBeLessThanOrEqual(NOTEBOOK_TEXT_WIDTH);
      const svg = getTemplate("notebook")!.render(ctx);
      expect(svg).toContain(copy.name);
      expect(svg).toContain(`fill="${ctx.surface.secondary}"`);
      expect(svg).toContain(`fill="${ctx.surface.primary}"`);
      // The mark is debossed: a highlight copy and a pressed copy.
      expect(svg).toContain('<g opacity=".3">');
      expect(svg).toContain('<g opacity=".28">');
    }
  });

  test("the notebook draws short names in full", () => {
    const ctx = mockupContext("light", "Acme");
    expect(notebookCopy(ctx).name).toBe("Acme");
  });

  test("the presentation wraps a long headline to at most three lines that fit the slide", () => {
    for (const mode of modes) {
      const ctx = longContext(mode);
      const lines = slideTitleLines(ctx);
      const { title } = slideSizes(ctx);
      expect(lines.length).toBeLessThanOrEqual(SLIDE_TITLE_LINES);
      expect(lines.at(-1)!.endsWith("...")).toBe(true);
      for (const line of lines) expect(width(ctx, line, title, "h")).toBeLessThanOrEqual(SLIDE_TITLE_WIDTH);
    }
    const unbroken = {
      ...mockupContext("light"),
      content: { ...mockupContext("light").content, headline: "x".repeat(200) },
    };
    expect(slideTitleLines(unbroken)).toHaveLength(1);
  });

  test("the presentation takes slide sizes from the live type scale, within a readable range", () => {
    const ctx = mockupContext("light");
    const sizes = slideSizes(ctx);
    expect(sizes.title).toBeGreaterThanOrEqual(56);
    expect(sizes.title).toBeLessThanOrEqual(84);
    expect(sizes.title).toBeGreaterThan(sizes.heading);
    expect(sizes.heading).toBeGreaterThan(sizes.body);
    const scale = ctx.brand.typography.scale.map((step) => ({ ...step, maxPx: step.maxPx * 3 }));
    const big = { ...ctx, brand: { ...ctx.brand, typography: { ...ctx.brand.typography, scale } } };
    expect(slideSizes(big).title).toBe(84);
  });

  test("the presentation draws two slides and falls back to the brand name without a headline", () => {
    const ctx = mockupContext("light", "Acme");
    const empty = { ...ctx, content: { ...ctx.content, headline: "" } };
    expect(slideTitleLines(empty)).toEqual(["Acme"]);
    expect(
      getTemplate("presentation")!
        .render(ctx)
        .match(/viewBox="0 0 1280 720"/g),
    ).toHaveLength(2);
  });

  test("the trade show booth keeps every line of copy inside its flat panel", () => {
    expect(BOOTH.bannerLines).toBe(5);
    for (const mode of modes) {
      const ctx = longContext(mode);
      const copy = boothCopy(ctx);
      expect(copy.wall.length).toBeLessThanOrEqual(2);
      expect(copy.banner.length).toBeLessThanOrEqual(BOOTH.bannerLines);
      for (const line of copy.wall) expect(width(ctx, line, 58, "h")).toBeLessThanOrEqual(BOOTH.wallTextWidth);
      for (const line of copy.banner) expect(width(ctx, line, 21, "h")).toBeLessThanOrEqual(BOOTH.bannerTextWidth);
      expect(width(ctx, copy.counterName, 36, "h")).toBeLessThanOrEqual(BOOTH.counterTextWidth);
      expect(width(ctx, copy.website, 26, "bb")).toBeLessThanOrEqual(BOOTH.wallTextWidth);
      expect(copy.website.endsWith("...")).toBe(true);
    }
  });

  test("the trade show booth draws the walls and floor as polygons toward one vanishing point", () => {
    const svg = getTemplate("trade-show-booth")!.render(mockupContext("light"));
    expect(svg.match(/<polygon points=/g)!.length).toBeGreaterThanOrEqual(3);
    expect(svg).toContain(`stop-color="${mockupContext("light").surface.primary}"`);
  });

  test("the delivery van shortens a 60 character name, website and phone to its side panel", () => {
    for (const mode of modes) {
      const ctx = longContext(mode);
      const copy = vanCopy(ctx);
      expect(copy.name.length).toBeLessThanOrEqual(VAN.nameLines);
      for (const line of copy.name) expect(width(ctx, line, 70, "h")).toBeLessThanOrEqual(VAN.textWidth);
      expect(width(ctx, copy.website, 40, "bb")).toBeLessThanOrEqual(VAN.websiteWidth);
      expect(width(ctx, copy.phone, 40, "bb")).toBeLessThanOrEqual(VAN.websiteWidth);
      expect(copy.website.endsWith("...")).toBe(true);
    }
  });

  test("the delivery van wraps the livery with a clip path in the brand colors", () => {
    for (const mode of modes) {
      const ctx = mockupContext(mode);
      const svg = getTemplate("delivery-van")!.render(ctx);
      expect(svg).toContain('<clipPath id="van-body">');
      expect(svg).toContain('clip-path="url(#van-body)"');
      expect(svg).toContain(`stop-color="${ctx.surface.primary}"`);
      expect(svg).toContain(`stop-color="${ctx.surface.secondary}"`);
    }
  });
});

test("every mockup is in a category the picker shows, and every category has mockups", () => {
  for (const template of mockupTemplates) expect(mockupCategories, template.id).toContain(template.category);
  for (const category of mockupCategories) {
    expect(
      mockupTemplates.some((template) => template.category === category),
      category,
    ).toBe(true);
  }
});
