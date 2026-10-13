import { logo, mockupDoc, onPrimaryLarge, text, truncate } from "@/lib/mockups/kit";
import { backdrop, glowBackdrop, heading, pill } from "@/lib/social/templates/shared";
import type { SocialTemplate } from "@/lib/social/types";

const W = 1776;
const H = 444;
// LinkedIn crops the sides on mobile, so the copy keeps to the central 1200 px.
const SAFE = { x: 288, y: 40, width: 1200, height: 364 };

export const linkedinEvent: SocialTemplate = {
  id: "linkedin-event",
  platform: "LinkedIn",
  label: "Event cover",
  width: W,
  height: H,
  description: "Event cover, 1776 × 444. Mobile crops the sides, so keep to the central 1200 × 364.",
  safe: SAFE,
  render(ctx) {
    const { surface, content } = ctx;
    const onColor = ctx.layout.background === "gradient";
    const on = onColor ? onPrimaryLarge(ctx) : surface.text;
    const x = SAFE.x;
    const maxWidth = SAFE.width;
    const mark = 56;
    const brandName = truncate(ctx, content.name, maxWidth - mark - 24, 34, "h");
    const line = heading(ctx, content.headline, x, 218, maxWidth, 72, on, { maxLines: 2 });
    const links = [content.website, content.handle].filter((item) => item.trim()).join("  ·  ");
    const footerY = SAFE.y + SAFE.height - 16;
    const badge = pill(
      ctx,
      0,
      0,
      "EVENT",
      18,
      onColor ? { fill: on, text: surface.primary } : { fill: surface.primary, text: onPrimaryLarge(ctx) },
      200,
    );
    const footer = truncate(ctx, links, maxWidth - badge.width - 40, 26, "bb");
    const body = `${backdrop(ctx, W, H, () => glowBackdrop(ctx, W, H, 44))}
      ${logo(ctx, { x, y: SAFE.y + 4, width: mark, height: mark }, onColor ? on : undefined, "li-event-mark")}
      ${text(x + mark + 24, SAFE.y + 4 + mark / 2 + 12, brandName, { size: 34, fill: on, font: "h" })}
      ${line.markup}
      ${text(x, footerY, footer, { size: 26, fill: onColor ? on : surface.primaryText, font: "bb" })}
      <g transform="translate(${x + maxWidth - badge.width} ${footerY - 26})">${badge.markup}</g>`;
    return mockupDoc(ctx, W, H, body);
  },
};
