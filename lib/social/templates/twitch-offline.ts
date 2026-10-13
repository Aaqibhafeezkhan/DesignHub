import { logo, mockupDoc, onPrimaryLarge, text, truncate, wrap } from "@/lib/mockups/kit";
import { backdrop, glowBackdrop, heading, pill } from "@/lib/social/templates/shared";
import type { SocialTemplate } from "@/lib/social/types";

const W = 1920;
const H = 1080;
const SAFE = { x: 160, y: 90, width: 1600, height: 900 };

export const twitchOffline: SocialTemplate = {
  id: "twitch-offline",
  platform: "Twitch",
  label: "Offline screen",
  width: W,
  height: H,
  description: "Offline screen, 1920 × 1080 (16:9). Shown on the channel while the stream is offline.",
  safe: SAFE,
  render(ctx) {
    const { surface, content } = ctx;
    const onColor = ctx.layout.background === "gradient";
    const on = onColor ? onPrimaryLarge(ctx) : surface.text;
    const maxWidth = SAFE.width - 160;
    const name = heading(ctx, content.name, W / 2, 560, maxWidth, 104, on, { maxLines: 2, anchor: "middle" });
    const tagline = wrap(ctx, content.headline, maxWidth, 42, "b", 2);
    const taglineY = name.bottom + 84;
    const links = [content.website, content.handle].filter((item) => item.trim()).join("  ·  ");
    const footer = truncate(ctx, links, maxWidth, 34, "bb");
    const status = pill(
      ctx,
      0,
      0,
      "OFFLINE",
      26,
      onColor ? { fill: on, text: surface.primary } : { fill: surface.primary, text: onPrimaryLarge(ctx) },
      360,
    );
    const body = `${backdrop(ctx, W, H, () => glowBackdrop(ctx, W, H, 64))}
      ${logo(ctx, { x: W / 2 - 80, y: SAFE.y + 60, width: 160, height: 160 }, onColor ? on : undefined, "twitch-off-mark")}
      <g transform="translate(${W / 2 - status.width / 2} ${SAFE.y + 270})">${status.markup}</g>
      ${name.markup}
      ${tagline
        .map((line, i) =>
          text(W / 2, taglineY + i * 56, line, {
            size: 42,
            fill: onColor ? on : surface.muted,
            anchor: "middle",
            opacity: onColor ? 0.85 : 1,
          }),
        )
        .join("")}
      ${text(W / 2, SAFE.y + SAFE.height - 20, footer, { size: 34, fill: onColor ? on : surface.primaryText, font: "bb", anchor: "middle" })}`;
    return mockupDoc(ctx, W, H, body);
  },
};
