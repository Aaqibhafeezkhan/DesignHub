import { logo, mockupDoc, onPrimaryLarge, text, truncate, wrap } from "@/lib/mockups/kit";
import { backdrop, glowBackdrop, heading } from "@/lib/social/templates/shared";
import type { SocialTemplate } from "@/lib/social/types";

const W = 2000;
const H = 1000;
// Ghost scales the cover with the window and crops the sides on small screens, so the copy keeps a wide margin.
const SAFE = { x: 240, y: 120, width: W - 480, height: H - 240 };

export const ghostCover: SocialTemplate = {
  id: "ghost-cover",
  platform: "Ghost",
  label: "Publication cover",
  width: W,
  height: H,
  description:
    "Publication cover, 2000 x 1000. Ghost crops the sides, so the logo, name and description stay centered.",
  safe: SAFE,
  render(ctx) {
    const { surface, content } = ctx;
    const onColor = ctx.layout.background === "gradient";
    const on = onColor ? onPrimaryLarge(ctx) : surface.text;
    const cx = W / 2;
    const mark = 160;
    const maxWidth = SAFE.width - 240;
    const name = heading(ctx, content.name, cx, SAFE.y + mark + 160, maxWidth, 96, on, {
      maxLines: 2,
      anchor: "middle",
    });
    // A long description is shortened to three lines, and a single long word is cut to the width.
    const tagline = wrap(ctx, content.headline, maxWidth, 36, "b", 3).map((line) =>
      truncate(ctx, line, maxWidth, 36, "b"),
    );
    const links = [content.website, content.handle].filter((item) => item.trim()).join("  ·  ");
    const footer = truncate(ctx, links, maxWidth, 28, "bb");
    const body = `${backdrop(ctx, W, H, () => glowBackdrop(ctx, W, H, 64))}
      ${logo(ctx, { x: cx - mark / 2, y: SAFE.y + 40, width: mark, height: mark }, onColor ? on : undefined, "ghost-mark")}
      ${name.markup}
      ${tagline.map((line, i) => text(cx, name.bottom + 76 + i * 48, line, { size: 36, fill: onColor ? on : surface.muted, anchor: "middle", opacity: onColor ? 0.88 : 1 })).join("")}
      ${text(cx, SAFE.y + SAFE.height - 8, footer, { size: 28, fill: onColor ? on : surface.primaryText, font: "bb", anchor: "middle" })}`;
    return mockupDoc(ctx, W, H, body);
  },
};
