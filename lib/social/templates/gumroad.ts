import { logo, mockupDoc, onPrimaryLarge, text, truncate, wrap } from "@/lib/mockups/kit";
import { backdrop, gradientBackdrop, heading } from "@/lib/social/templates/shared";
import type { SocialTemplate } from "@/lib/social/types";

const W = 1280;
const H = 420;
// Gumroad crops the sides on phones, and the profile avatar overlaps the bottom left of the cover.
const SAFE = { x: 120, y: 36, width: W - 240, height: H - 72 };
const AVATAR = { x: SAFE.x, y: H - 150, width: 150, height: 150 };

export const gumroadCover: SocialTemplate = {
  id: "gumroad-cover",
  platform: "Gumroad",
  label: "Profile cover",
  width: W,
  height: H,
  description: "Creator profile cover, 1280 × 420. The avatar covers the bottom left and phones crop the sides.",
  safe: SAFE,
  covered: [AVATAR],
  render(ctx) {
    const { surface, content } = ctx;
    const onColor = ctx.layout.background === "auto" || ctx.layout.background === "gradient";
    const on = onColor ? onPrimaryLarge(ctx) : surface.text;
    const accent = onColor ? on : surface.primaryText;
    // The copy sits to the right of the avatar zone, so nothing is hidden behind it.
    const x = AVATAR.x + AVATAR.width + 48;
    const maxWidth = SAFE.x + SAFE.width - x;
    const name = heading(ctx, content.name, x, 150, maxWidth, 60, on, { maxLines: 1 });
    const tagline = wrap(ctx, content.headline, maxWidth, 26, "b", 2);
    const links = truncate(
      ctx,
      [content.website, content.handle].filter((item) => item.trim()).join("  ·  "),
      maxWidth,
      24,
      "bb",
    );
    const body = `${backdrop(ctx, W, H, () => gradientBackdrop(ctx, W, H))}
      ${logo(ctx, { x: SAFE.x, y: SAFE.y + 4, width: 56, height: 56 }, onColor ? on : undefined, "gumroad-mark")}
      ${name.markup}
      ${tagline.map((line, i) => text(x, 202 + i * 36, line, { size: 26, fill: on, opacity: 0.85 })).join("")}
      ${text(x, 318, links, { size: 24, fill: accent, font: "bb", opacity: onColor ? 0.92 : 1 })}`;
    return mockupDoc(ctx, W, H, body);
  },
};
