import { logo, mockupDoc, onPrimaryLarge, text, truncate } from "@/lib/mockups/kit";
import { backdrop, gradientBackdrop } from "@/lib/social/templates/shared";
import type { SocialTemplate } from "@/lib/social/types";

const W = 1080;
const H = 1920;
/** Instagram crops a highlight cover to a circle about 1080 px across, centered on the canvas. */
const CIRCLE = { cx: W / 2, cy: H / 2, r: 480 };
const SAFE = { x: 0, y: CIRCLE.cy - CIRCLE.r, width: W, height: CIRCLE.r * 2 };
const LABEL_MAX_CHARS = 12;

/** A short label: the call to action, else the name, cut to 12 characters and then to the circle's width. */
function shortLabel(value: string): string {
  const trimmed = value.trim();
  return trimmed.length > LABEL_MAX_CHARS ? `${trimmed.slice(0, LABEL_MAX_CHARS - 1).trimEnd()}…` : trimmed;
}

export const instagramHighlight: SocialTemplate = {
  id: "instagram-highlight",
  platform: "Instagram",
  label: "Highlight cover",
  width: W,
  height: H,
  description: "Story highlight cover, 1080 × 1920. Instagram shows only the central circle.",
  safe: SAFE,
  covered: [
    { x: 0, y: 0, width: W, height: SAFE.y },
    { x: 0, y: SAFE.y + SAFE.height, width: W, height: H - SAFE.y - SAFE.height },
  ],
  render(ctx) {
    const { content } = ctx;
    const on = onPrimaryLarge(ctx);
    const label = shortLabel(content.cta || content.name);
    const markSize = label ? 380 : 440;
    const markY = label ? CIRCLE.cy - 250 : CIRCLE.cy - markSize / 2;
    const labelMarkup = label
      ? text(W / 2, CIRCLE.cy + 250, truncate(ctx, label, 640, 72, "bb", 4), {
          size: 72,
          fill: on,
          font: "bb",
          anchor: "middle",
          spacing: 4,
        })
      : "";
    const body = `${backdrop(ctx, W, H, () => gradientBackdrop(ctx, W, H))}
      <circle cx="${CIRCLE.cx}" cy="${CIRCLE.cy}" r="${CIRCLE.r}" fill="${on}" opacity="0.12"/>
      ${logo(ctx, { x: W / 2 - markSize / 2, y: markY, width: markSize, height: markSize }, on, "highlight-mark")}
      ${labelMarkup}`;
    return mockupDoc(ctx, W, H, body);
  },
};
