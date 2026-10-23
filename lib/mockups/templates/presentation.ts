import { lines, logo, mockupDoc, onPrimaryLarge, text, truncate, wrap } from "@/lib/mockups/kit";
import { screen, studio } from "@/lib/mockups/templates/devices";
import type { MockupContext, MockupTemplate } from "@/lib/mockups/types";

const W = 2000;
const H = 1300;
/** Slides are drawn in a 1280 x 720 (16:9) space and scaled to their place on the stage. */
const SW = 1280;
const SH = 720;
const PAD = 90;
export const SLIDE_TITLE_WIDTH = 880;
const TITLE_WIDTH = SLIDE_TITLE_WIDTH;
/** The slide title may run to three lines. */
export const SLIDE_TITLE_LINES = 3;

/** A step of the live type scale by its number, in px, kept inside a range so a slide stays readable. */
function scaleSize(ctx: MockupContext, step: number, fallback: number, min: number, max: number): number {
  const found = ctx.brand.typography.scale.find((item) => item.step === step);
  return Math.min(max, Math.max(min, Math.round(found?.maxPx ?? fallback)));
}

/** Sizes for the slides, from the brand's type scale: step 5 for the title, 3 for headings, 1 for body. */
export function slideSizes(ctx: MockupContext): { title: number; heading: number; body: number } {
  return {
    title: scaleSize(ctx, 5, 72, 56, 84),
    heading: scaleSize(ctx, 3, 44, 36, 56),
    body: scaleSize(ctx, 1, 24, 22, 28),
  };
}

/**
 * The title slide's headline: wrapped to the title width in the live heading font, at most three
 * lines, and each line cut to fit so a single long word can't run off the slide.
 */
export function slideTitleLines(ctx: MockupContext): string[] {
  const { title } = slideSizes(ctx);
  const headline = ctx.content.headline.trim() || ctx.brand.name;
  return wrap(ctx, headline, TITLE_WIDTH, title, "h", SLIDE_TITLE_LINES).map((line) =>
    truncate(ctx, line, TITLE_WIDTH, title, "h"),
  );
}

function titleSlide(ctx: MockupContext): string {
  const { surface, brand, content } = ctx;
  const on = onPrimaryLarge(ctx);
  const sizes = slideSizes(ctx);
  const headline = slideTitleLines(ctx);
  const top = 300 - ((headline.length - 1) * sizes.title * 1.08) / 2;
  const title = headline
    .map((line, i) => text(PAD, top + i * sizes.title * 1.08, line, { size: sizes.title, fill: on, font: "h" }))
    .join("");
  const baseline = top + (headline.length - 1) * sizes.title * 1.08;
  const cta = truncate(ctx, content.cta.trim(), 520, 26, "bb");
  const ctaWidth = cta ? ctx.measure(cta, brand.typography.body, 600, 26) + 72 : 0;
  const presenter = truncate(
    ctx,
    [content.person, content.role].filter((item) => item.trim()).join(", "),
    TITLE_WIDTH,
    24,
    "b",
  );
  return `<rect width="${SW}" height="${SH}" fill="url(#pr-bg)"/>
    <circle cx="${SW - 160}" cy="120" r="300" fill="${on}" fill-opacity=".08"/>
    <circle cx="${SW - 60}" cy="260" r="170" fill="${on}" fill-opacity=".08"/>
    ${logo(ctx, { x: PAD, y: 70, width: 64, height: 64 }, on, "pr-title-mark")}
    ${text(PAD + 88, 112, truncate(ctx, brand.name.toUpperCase(), 600, 24, "bb", 5), { size: 24, fill: on, font: "bb", spacing: 5, opacity: 0.85 })}
    ${title}
    ${cta ? `<rect x="${PAD}" y="${baseline + 56}" width="${ctaWidth}" height="64" rx="32" fill="${on}"/>${text(PAD + ctaWidth / 2, baseline + 98, cta, { size: 26, fill: surface.primary, font: "bb", anchor: "middle" })}` : ""}
    ${presenter ? text(PAD, SH - 64, presenter, { size: 24, fill: on, opacity: 0.85 }) : ""}`;
}

function contentSlide(ctx: MockupContext): string {
  const { surface, brand, content } = ctx;
  const sizes = slideSizes(ctx);
  const r = Math.min(brand.radius, 20);
  const heading = truncate(ctx, content.cta.trim() || "Why it works", SW - PAD * 2, sizes.heading, "h");
  const bars = [0.46, 0.62, 0.78, 0.94];
  const chartX = 700;
  const chartW = SW - chartX - PAD;
  const base = 600;
  const barW = (chartW - 3 * 28) / 4;
  const chart = bars
    .map((value, i) => {
      const h = value * 340;
      const x = chartX + i * (barW + 28);
      return `<rect x="${x}" y="${base - h}" width="${barW}" height="${h}" rx="${Math.min(r, barW / 2)}" fill="${i === bars.length - 1 ? surface.primary : surface.secondary}" fill-opacity="${i === bars.length - 1 ? 1 : 0.55}"/>`;
    })
    .join("");
  const points = ["Clear, consistent identity", "One system for every channel", "Built to scale with the team"];
  const list = points
    .map((point, i) => {
      const y = 290 + i * 84;
      return `<circle cx="${PAD + 12}" cy="${y - 8}" r="9" fill="${i === 1 ? surface.secondary : surface.primary}"/>
        ${text(PAD + 44, y, truncate(ctx, point, 520, sizes.body, "b"), { size: sizes.body, fill: surface.text })}`;
    })
    .join("");
  return `<rect width="${SW}" height="${SH}" fill="${surface.background}"/>
    <rect x="${PAD}" y="86" width="56" height="6" rx="3" fill="${surface.primary}"/>
    ${text(PAD, 190, heading, { size: sizes.heading, fill: surface.text, font: "h" })}
    ${list}
    <rect x="${chartX - 30}" y="250" width="${chartW + 60}" height="400" rx="${r}" fill="${surface.surface}" stroke="${surface.border}"/>
    ${chart}
    <rect x="${chartX}" y="${base}" width="${chartW}" height="2" fill="${surface.border}"/>
    ${lines(PAD, 560, 520, 2, 30, surface.border)}
    ${logo(ctx, { x: SW - PAD - 44, y: SH - 84, width: 44, height: 44 }, undefined, "pr-content-mark")}
    ${text(PAD, SH - 48, truncate(ctx, brand.name, 520, 20, "bb"), { size: 20, fill: surface.muted, font: "bb" })}`;
}

/** A slide on the stage: a thin frame, the 16:9 content scaled in, and a soft shadow. */
function slide(x: number, y: number, width: number, body: string): string {
  const height = (width * SH) / SW;
  return `<g transform="translate(${x} ${y})">
    <rect x="-8" y="-8" width="${width + 16}" height="${height + 16}" rx="14" fill="#1d1e22" filter="url(#soft)"/>
    ${screen(0, 0, width, height, body, SW, SH)}
  </g>`;
}

export const presentation: MockupTemplate = {
  id: "presentation",
  label: "Presentation",
  category: "Screens",
  description: "A title slide and a content slide in 16:9 on a stage.",
  render(ctx) {
    const { surface } = ctx;
    const defs = `<linearGradient id="pr-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${surface.primary}"/><stop offset="1" stop-color="${surface.secondary}"/></linearGradient>`;
    const stage = `${studio(ctx, W, H)}
      <rect y="1010" width="${W}" height="${H - 1010}" fill="#000" fill-opacity="${ctx.mode === "dark" ? 0.35 : 0.08}"/>`;
    return mockupDoc(
      ctx,
      W,
      H,
      `${stage}${slide(140, 150, 1180, titleSlide(ctx))}${slide(780, 640, 1080, contentSlide(ctx))}`,
      defs,
    );
  },
};
