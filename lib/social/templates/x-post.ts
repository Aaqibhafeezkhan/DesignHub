import { logo, mockupDoc, onPrimaryLarge, text, truncate } from "@/lib/mockups/kit";
import { backdrop, glowBackdrop, heading } from "@/lib/social/templates/shared";
import type { SocialTemplate } from "@/lib/social/types";

const W = 1600;
const H = 900;
// X crops timeline images to a wide strip, so the text stays in the central 80 percent.
const SAFE = { x: 160, y: 90, width: 1280, height: 720 };

export const xPostImage: SocialTemplate = {
  id: "x-post-image",
  platform: "X",
  label: "Post image",
  width: W,
  height: H,
  description:
    "Post image, 1600 × 900 (16:9). The timeline crops the edges, so the text stays in the central 80 percent.",
  safe: SAFE,
  render(ctx) {
    const { surface, content } = ctx;
    const onColor = ctx.layout.background === "gradient";
    const on = onColor ? onPrimaryLarge(ctx) : surface.text;
    const mark = 88;
    const nameX = SAFE.x + mark + 28;
    const name = truncate(ctx, content.name, SAFE.width - mark - 28, 44, "bb");
    const title = heading(ctx, content.headline, SAFE.x, 400, SAFE.width, 96, on, { maxLines: 2 });
    const subtitle = truncate(ctx, content.subtitle, SAFE.width, 40, "b");
    const links = [content.website, content.handle].filter((item) => item.trim()).join("  ·  ");
    const footer = truncate(ctx, links, SAFE.width, 32, "bb");
    const body = `${backdrop(ctx, W, H, () => glowBackdrop(ctx, W, H, 60))}
      ${logo(ctx, { x: SAFE.x, y: SAFE.y, width: mark, height: mark }, onColor ? on : undefined, "x-post-mark")}
      ${text(nameX, SAFE.y + mark / 2 + 15, name, { size: 44, fill: on, font: "bb" })}
      ${title.markup}
      ${text(SAFE.x, title.bottom + 76, subtitle, { size: 40, fill: onColor ? on : surface.muted, opacity: onColor ? 0.88 : 1 })}
      ${text(SAFE.x, SAFE.y + SAFE.height - 8, footer, { size: 32, fill: onColor ? on : surface.primaryText, font: "bb" })}`;
    return mockupDoc(ctx, W, H, body);
  },
};
