import { logo, mockupDoc, onPrimaryLarge, text, truncate, wrap } from "@/lib/mockups/kit";
import { backdrop, gradientBackdrop, heading } from "@/lib/social/templates/shared";
import type { SocialTemplate } from "@/lib/social/types";

const W = 1500;
const H = 600;
// Notion centre-crops the cover to the window width, so the copy keeps a wide margin.
const SAFE = { x: 150, y: 48, width: W - 300, height: H - 96 };
// The page icon and title sit over the lower left of the cover.
const TITLE = { x: SAFE.x, y: H - 180, width: 560, height: 180 };

export const notionCover: SocialTemplate = {
  id: "notion-cover",
  platform: "Notion",
  label: "Page cover",
  width: W,
  height: H,
  description: "Page cover, 1500 × 600. The page icon and title cover the lower left and Notion crops the sides.",
  safe: SAFE,
  covered: [TITLE],
  render(ctx) {
    const { surface, content } = ctx;
    const onColor = ctx.layout.background === "auto" || ctx.layout.background === "gradient";
    const on = onColor ? onPrimaryLarge(ctx) : surface.text;
    const accent = onColor ? on : surface.primaryText;
    const maxWidth = SAFE.width;
    const mark = 72;
    const name = heading(ctx, content.name, SAFE.x, SAFE.y + mark + 90, maxWidth, 76, on, { maxLines: 1 });
    const tagline = wrap(ctx, content.headline, Math.min(maxWidth, 900), 30, "b", 2);
    // The links run along the bottom, to the right of the title zone.
    const linksX = TITLE.x + TITLE.width + 40;
    const links = truncate(
      ctx,
      [content.website, content.handle].filter((item) => item.trim()).join("  ·  "),
      SAFE.x + SAFE.width - linksX,
      26,
      "bb",
    );
    const body = `${backdrop(ctx, W, H, () => gradientBackdrop(ctx, W, H))}
      ${logo(ctx, { x: SAFE.x, y: SAFE.y, width: mark, height: mark }, onColor ? on : undefined, "notion-mark")}
      ${name.markup}
      ${tagline.map((line, i) => text(SAFE.x, name.bottom + 64 + i * 40, line, { size: 30, fill: on, opacity: 0.85 })).join("")}
      ${text(SAFE.x + SAFE.width, H - 72, links, { size: 26, fill: accent, font: "bb", anchor: "end", opacity: onColor ? 0.92 : 1 })}`;
    return mockupDoc(ctx, W, H, body);
  },
};
