import { logo, mockupDoc, onPrimaryLarge, text, truncate, wrap } from "@/lib/mockups/kit";
import { backdrop, glowBackdrop, heading } from "@/lib/social/templates/shared";
import type { SocialTemplate } from "@/lib/social/types";

const W = 1280;
const H = 720;
// Telegram crops the preview on mobile, so the logo, name and tagline stay in the central 60 percent.
const SAFE = { x: 256, y: 144, width: 768, height: 432 };

export const telegramCover: SocialTemplate = {
  id: "telegram-cover",
  platform: "Telegram",
  label: "Channel cover",
  width: W,
  height: H,
  description: "Channel cover and link preview, 1280 × 720 (16:9). Mobile crops the edges, so keep to the safe area.",
  safe: SAFE,
  render(ctx) {
    const { surface, content } = ctx;
    const onColor = ctx.layout.background === "gradient";
    const on = onColor ? onPrimaryLarge(ctx) : surface.text;
    const cx = W / 2;
    const mark = 104;
    const maxWidth = SAFE.width;
    const name = heading(ctx, content.name, cx, SAFE.y + mark + 110, maxWidth, 64, on, {
      maxLines: 2,
      anchor: "middle",
    });
    const tagline = wrap(ctx, content.headline, maxWidth, 28, "b", 1)[0] ?? "";
    const links = [content.website, content.handle].filter((item) => item.trim()).join("  ·  ");
    const footer = truncate(ctx, links, maxWidth, 24, "bb");
    const body = `${backdrop(ctx, W, H, () => glowBackdrop(ctx, W, H, 48))}
      ${logo(ctx, { x: cx - mark / 2, y: SAFE.y + 8, width: mark, height: mark }, onColor ? on : undefined, "telegram-mark")}
      ${name.markup}
      ${text(cx, name.bottom + 52, tagline, { size: 28, fill: onColor ? on : surface.muted, anchor: "middle", opacity: onColor ? 0.88 : 1 })}
      ${text(cx, SAFE.y + SAFE.height - 8, footer, { size: 24, fill: onColor ? on : surface.primaryText, font: "bb", anchor: "middle" })}`;
    return mockupDoc(ctx, W, H, body);
  },
};
