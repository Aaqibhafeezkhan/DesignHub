import { logo, mockupDoc, onPrimaryLarge, text, truncate, wrap } from "@/lib/mockups/kit";
import { backdrop, glowBackdrop, heading } from "@/lib/social/templates/shared";
import type { SocialTemplate } from "@/lib/social/types";

const W = 975;
const H = 180;
// Bandcamp shows the header at full size above the artist page and scales it down on phones, so
// the copy keeps a small margin and stays large enough to read when shrunk.
const SAFE = { x: 24, y: 16, width: W - 48, height: H - 32 };

export const bandcampHeader: SocialTemplate = {
  id: "bandcamp-header",
  platform: "Bandcamp",
  label: "Page header",
  width: W,
  height: H,
  description: "Artist page header, 975 × 180. Phones scale it down, so keep the type large.",
  safe: SAFE,
  render(ctx) {
    const { surface, content } = ctx;
    const onColor = ctx.layout.background === "gradient";
    const on = onColor ? onPrimaryLarge(ctx) : surface.text;
    // The mark sits on a brand tile on the left, the copy to its right.
    const tile = 120;
    const tileX = SAFE.x + 24;
    const tileY = H / 2 - tile / 2;
    const radius = Math.min(ctx.brand.radius * 1.5, tile * 0.3);
    const x = tileX + tile + 32;
    const maxWidth = SAFE.x + SAFE.width - 24 - x;
    const name = heading(ctx, content.name, x, 82, maxWidth, 48, on, { maxLines: 1 });
    const tagline = wrap(ctx, content.headline, maxWidth, 22, "b", 1)[0] ?? "";
    const links = [content.website, content.handle].filter((item) => item.trim()).join("  ·  ");
    const footer = truncate(ctx, links, maxWidth, 18, "bb");
    const body = `${backdrop(ctx, W, H, () => glowBackdrop(ctx, W, H, 30))}
      <rect x="${tileX}" y="${tileY}" width="${tile}" height="${tile}" rx="${radius}" fill="${onColor ? on : surface.primary}" fill-opacity="${onColor ? 0.14 : 1}"/>
      ${logo(ctx, { x: tileX + 24, y: tileY + 24, width: tile - 48, height: tile - 48 }, onColor ? on : onPrimaryLarge(ctx), "bandcamp-mark")}
      ${name.markup}
      ${text(x, 116, tagline, { size: 22, fill: onColor ? on : surface.muted, opacity: onColor ? 0.85 : 1 })}
      ${text(x, 148, footer, { size: 18, fill: onColor ? on : surface.primaryText, font: "bb" })}`;
    return mockupDoc(ctx, W, H, body);
  },
};
