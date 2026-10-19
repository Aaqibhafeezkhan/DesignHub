import { logo, mockupDoc, onPrimaryLarge, text, truncate } from "@/lib/mockups/kit";
import { backdrop, glowBackdrop, heading } from "@/lib/social/templates/shared";
import type { SocialTemplate } from "@/lib/social/types";

const W = 3360;
const H = 840;
const SAFE = { x: 560, y: 100, width: 2720, height: 640 };

export const etsyShopBanner: SocialTemplate = {
  id: "etsy-shop-banner",
  platform: "Etsy",
  label: "Shop banner",
  width: W,
  height: H,
  description: "Shop banner, 3360 × 840. Keep text and logo in the safe area; Etsy's shop icon covers the lower left.",
  safe: SAFE,
  covered: [{ x: 0, y: 440, width: 520, height: 400 }],
  render(ctx) {
    const { surface, content } = ctx;
    const onColor = ctx.layout.background === "gradient";
    const on = onColor ? onPrimaryLarge(ctx) : surface.text;
    const textX = SAFE.x + 40;
    const logoSize = 280;
    const logoX = SAFE.x + SAFE.width - logoSize - 60;
    const maxWidth = logoX - textX - 100;
    const name = heading(ctx, content.name, textX, 340, maxWidth, 112, on, { maxLines: 1 });
    const headline = truncate(ctx, content.headline, maxWidth, 48, "b");
    const website = truncate(ctx, content.website, maxWidth, 36, "bb");
    const body = `${backdrop(ctx, W, H, () => glowBackdrop(ctx, W, H, 72))}
      ${name.markup}
      ${text(textX, name.bottom + 88, headline, { size: 48, fill: onColor ? on : surface.muted, font: "b" })}
      ${text(textX, name.bottom + 160, website, { size: 36, fill: onColor ? on : surface.primary, font: "bb" })}
      ${logo(ctx, { x: logoX, y: H / 2 - logoSize / 2, width: logoSize, height: logoSize }, undefined, "etsy-shop-mark")}`;
    return mockupDoc(ctx, W, H, body);
  },
};
