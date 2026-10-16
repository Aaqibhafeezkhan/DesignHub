import { logo, mockupDoc, onPrimaryLarge, text, truncate, wrap } from "@/lib/mockups/kit";
import { backdrop, glowBackdrop, heading } from "@/lib/social/templates/shared";
import type { SocialTemplate } from "@/lib/social/types";

const W = 1600;
const H = 840;
// Hashnode shows the cover at about 1.9:1 and crops on small screens, so keep a 10 percent margin.
const SAFE = { x: 160, y: 84, width: 1280, height: 672 };

export const hashnodeCover: SocialTemplate = {
  id: "hashnode-cover",
  platform: "Hashnode",
  label: "Blog cover",
  width: W,
  height: H,
  description: "Blog cover, 1600 × 840. Keep the title inside the safe area.",
  safe: SAFE,
  render(ctx) {
    const { surface, content } = ctx;
    const onColor = ctx.layout.background === "gradient";
    const on = onColor ? onPrimaryLarge(ctx) : surface.text;
    const cx = W / 2;
    const mark = 120;
    const maxWidth = SAFE.width;
    const name = heading(ctx, content.name, cx, SAFE.y + mark + 130, maxWidth, 96, on, {
      maxLines: 2,
      anchor: "middle",
    });
    const tagline = wrap(ctx, content.headline, maxWidth, 40, "b", 1)[0] ?? "";
    const links = [content.website, content.handle].filter((item) => item.trim()).join("  ·  ");
    const footer = truncate(ctx, links, maxWidth, 32, "bb");
    const body = `${backdrop(ctx, W, H, () => glowBackdrop(ctx, W, H, 60))}
      ${logo(ctx, { x: cx - mark / 2, y: SAFE.y + 8, width: mark, height: mark }, onColor ? on : undefined, "hashnode-mark")}
      ${name.markup}
      ${text(cx, name.bottom + 80, tagline, { size: 40, fill: onColor ? on : surface.muted, anchor: "middle", opacity: onColor ? 0.88 : 1 })}
      ${text(cx, SAFE.y + SAFE.height - 8, footer, { size: 32, fill: onColor ? on : surface.primaryText, font: "bb", anchor: "middle" })}`;
    return mockupDoc(ctx, W, H, body);
  },
};
