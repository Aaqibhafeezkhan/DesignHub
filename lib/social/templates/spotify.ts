import { logo, mockupDoc, onPrimaryLarge, text, wrap } from "@/lib/mockups/kit";
import { backdrop, gradientBackdrop, heading } from "@/lib/social/templates/shared";
import type { SocialTemplate } from "@/lib/social/types";

const W = 640;
const H = 640;
// Spotify rounds the corners and shows covers as small as 64 px, so only a few big words are drawn.
const SAFE = { x: 48, y: 48, width: W - 96, height: H - 96 };

export const spotifyPlaylistCover: SocialTemplate = {
  id: "spotify-playlist-cover",
  platform: "Spotify",
  label: "Playlist cover",
  width: W,
  height: H,
  description: "Playlist cover, 640 × 640. Shown small, so it carries the logo, the name and a short tagline only.",
  safe: SAFE,
  render(ctx) {
    const { content } = ctx;
    const onColor = ctx.layout.background === "auto" || ctx.layout.background === "gradient";
    const on = onColor ? onPrimaryLarge(ctx) : ctx.surface.text;
    const cx = W / 2;
    const mark = 128;
    const name = heading(ctx, content.name, cx, 360, SAFE.width, 88, on, { maxLines: 2, anchor: "middle" });
    const tagline = wrap(ctx, content.headline, SAFE.width, 32, "b", 1)[0] ?? "";
    const body = `${backdrop(ctx, W, H, () => gradientBackdrop(ctx, W, H))}
      ${logo(ctx, { x: cx - mark / 2, y: SAFE.y + 24, width: mark, height: mark }, onColor ? on : undefined, "spotify-mark")}
      ${name.markup}
      ${text(cx, name.bottom + 60, tagline, { size: 32, fill: on, anchor: "middle", opacity: 0.88 })}`;
    return mockupDoc(ctx, W, H, body);
  },
};
