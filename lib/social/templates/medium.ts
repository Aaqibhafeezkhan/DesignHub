import { logo, mockupDoc, onPrimaryLarge, text, truncate, wrap } from "@/lib/mockups/kit";
import { backdrop, glowBackdrop, heading } from "@/lib/social/templates/shared";
import type { SocialTemplate } from "@/lib/social/types";

const W = 1500;
const H = 500;
// Medium scales the banner to the page width, so the copy keeps a margin on every side.
const SAFE = { x: 90, y: 40, width: W - 180, height: H - 80 };

export const mediumBanner: SocialTemplate = {
  id: "medium-banner",
  platform: "Medium",
  label: "Publication banner",
  width: W,
  height: H,
  description: "Publication banner, 1500 × 500. Scales with the page width, so keep the type large.",
  safe: SAFE,
  render(ctx) {
    const { surface, content } = ctx;
    const onColor = ctx.layout.background === "gradient";
    const on = onColor ? onPrimaryLarge(ctx) : surface.text;
    const mark = 150;
    const markX = SAFE.x + 30;
    const x = markX + mark + 56;
    const maxWidth = SAFE.x + SAFE.width - 30 - x;
    const name = heading(ctx, content.name, x, 205, maxWidth, 68, on, { maxLines: 1 });
    // A long tagline is shortened to two lines instead of running on.
    const tagline = wrap(ctx, content.headline, maxWidth, 32, "b", 2);
    const links = [content.website, content.handle].filter((item) => item.trim()).join("  ·  ");
    const footer = truncate(ctx, links, maxWidth, 24, "bb");
    const body = `${backdrop(ctx, W, H, () => glowBackdrop(ctx, W, H, 40))}
      ${logo(ctx, { x: markX, y: H / 2 - mark / 2, width: mark, height: mark }, onColor ? on : undefined, "medium-mark")}
      ${name.markup}
      ${tagline.map((line, i) => text(x, 266 + i * 42, line, { size: 32, fill: onColor ? on : surface.muted, opacity: onColor ? 0.88 : 1 })).join("")}
      ${text(x, 398, footer, { size: 24, fill: onColor ? on : surface.primaryText, font: "bb" })}`;
    return mockupDoc(ctx, W, H, body);
  },
};
