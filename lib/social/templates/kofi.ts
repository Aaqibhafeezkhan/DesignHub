import { logo, mockupDoc, onPrimaryLarge, text, wrap } from "@/lib/mockups/kit";
import { backdrop, glowBackdrop, heading, pill } from "@/lib/social/templates/shared";
import type { SocialTemplate } from "@/lib/social/types";

const W = 1920;
const H = 480;
// Ko-fi centers the page on wide screens and crops the sides on phones.
const SAFE = { x: 240, y: 48, width: W - 480, height: H - 96 };

export const kofiBanner: SocialTemplate = {
  id: "kofi-banner",
  platform: "Ko-fi",
  label: "Page banner",
  width: W,
  height: H,
  description: "Page banner, 1920 × 480 (4:1). Wide screens center the page and phones crop the sides.",
  safe: SAFE,
  render(ctx) {
    const { surface, content } = ctx;
    const onColor = ctx.layout.background === "gradient";
    const on = onColor ? onPrimaryLarge(ctx) : surface.text;
    const maxWidth = SAFE.width - 200;
    const name = heading(ctx, content.name, SAFE.x, 200, maxWidth, 84, on, { maxLines: 1 });
    const tagline = wrap(ctx, content.headline, maxWidth, 32, "b", 2);
    const cta = content.cta.trim() || "Support me";
    const pillBox = pill(
      ctx,
      SAFE.x,
      336,
      cta,
      28,
      { fill: onColor ? on : surface.primary, text: onColor ? surface.primary : onPrimaryLarge(ctx) },
      480,
    );
    const body = `${backdrop(ctx, W, H, () => glowBackdrop(ctx, W, H, 28))}
      ${logo(ctx, { x: SAFE.x + SAFE.width - 120, y: SAFE.y + 24, width: 120, height: 120 }, onColor ? on : undefined, "kofi-mark")}
      ${name.markup}
      ${tagline.map((line, i) => text(SAFE.x, 262 + i * 42, line, { size: 32, fill: onColor ? on : surface.muted, opacity: onColor ? 0.88 : 1 })).join("")}
      ${pillBox}`;
    return mockupDoc(ctx, W, H, body);
  },
};
