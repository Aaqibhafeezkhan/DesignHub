import { logo, mockupDoc, onPrimaryLarge, text, truncate, wrap } from "@/lib/mockups/kit";
import { backdrop, glowBackdrop, heading } from "@/lib/social/templates/shared";
import type { SocialTemplate } from "@/lib/social/types";

const W = 1100;
const H = 220;
// Substack scales the banner to the page width, so the copy keeps a margin on every side.
const SAFE = { x: 60, y: 24, width: W - 120, height: H - 48 };

export const substackBanner: SocialTemplate = {
  id: "substack-banner",
  platform: "Substack",
  label: "Publication banner",
  width: W,
  height: H,
  description: "Publication banner, 1100 × 220. Scales with the page width, so keep the type large.",
  safe: SAFE,
  render(ctx) {
    const { surface, content } = ctx;
    const onColor = ctx.layout.background === "gradient";
    const on = onColor ? onPrimaryLarge(ctx) : surface.text;
    const mark = 96;
    const markX = SAFE.x + 20;
    const x = markX + mark + 36;
    const maxWidth = SAFE.x + SAFE.width - 20 - x;
    const name = heading(ctx, content.name, x, 100, maxWidth, 52, on, { maxLines: 1 });
    const tagline = wrap(ctx, content.headline, maxWidth, 26, "b", 1)[0] ?? "";
    const links = [content.website, content.handle].filter((item) => item.trim()).join("  ·  ");
    const footer = truncate(ctx, links, maxWidth, 20, "bb");
    const body = `${backdrop(ctx, W, H, () => glowBackdrop(ctx, W, H, 36))}
      ${logo(ctx, { x: markX, y: H / 2 - mark / 2, width: mark, height: mark }, onColor ? on : undefined, "substack-mark")}
      ${name.markup}
      ${text(x, 140, tagline, { size: 26, fill: onColor ? on : surface.muted, opacity: onColor ? 0.88 : 1 })}
      ${text(x, 175, footer, { size: 20, fill: onColor ? on : surface.primaryText, font: "bb" })}`;
    return mockupDoc(ctx, W, H, body);
  },
};
