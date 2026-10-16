import { logo, mockupDoc, onPrimaryLarge, text, truncate, wrap } from "@/lib/mockups/kit";
import { backdrop, glowBackdrop, heading } from "@/lib/social/templates/shared";
import type { SocialTemplate } from "@/lib/social/types";

const W = 1000;
const H = 420;
// DEV crops the cover to a wide strip in feeds, so the copy stays in the central band.
const SAFE = { x: 150, y: 56, width: 700, height: 308 };

export const devtoCover: SocialTemplate = {
  id: "devto-cover",
  platform: "DEV",
  label: "Post cover",
  width: W,
  height: H,
  description: "Post cover, 1000 × 420. Feeds crop it to a wide strip, so keep the title in the central safe area.",
  safe: SAFE,
  render(ctx) {
    const { surface, content } = ctx;
    const onColor = ctx.layout.background === "gradient";
    const on = onColor ? onPrimaryLarge(ctx) : surface.text;
    const cx = W / 2;
    const mark = 60;
    const maxWidth = SAFE.width;
    const name = heading(ctx, content.name, cx, SAFE.y + mark + 52, maxWidth, 40, on, {
      maxLines: 2,
      anchor: "middle",
    });
    const tagline = wrap(ctx, content.headline, maxWidth, 22, "b", 1)[0] ?? "";
    const links = [content.website, content.handle].filter((item) => item.trim()).join("  ·  ");
    const footer = truncate(ctx, links, maxWidth, 20, "bb");
    const body = `${backdrop(ctx, W, H, () => glowBackdrop(ctx, W, H, 32))}
      ${logo(ctx, { x: cx - mark / 2, y: SAFE.y + 6, width: mark, height: mark }, onColor ? on : undefined, "devto-mark")}
      ${name.markup}
      ${text(cx, name.bottom + 36, tagline, { size: 22, fill: onColor ? on : surface.muted, anchor: "middle", opacity: onColor ? 0.88 : 1 })}
      ${text(cx, SAFE.y + SAFE.height - 8, footer, { size: 20, fill: onColor ? on : surface.primaryText, font: "bb", anchor: "middle" })}`;
    return mockupDoc(ctx, W, H, body);
  },
};
