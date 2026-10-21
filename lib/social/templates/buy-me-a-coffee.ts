import { logo, mockupDoc, onPrimaryLarge, text, truncate, wrap } from "@/lib/mockups/kit";
import { backdrop, gradientBackdrop, pill } from "@/lib/social/templates/shared";
import type { SocialTemplate } from "@/lib/social/types";

const W = 1200;
const H = 400;
// Buy Me a Coffee crops the sides on phones, so the copy keeps a wide margin.
const SAFE = { x: 96, y: 36, width: W - 192, height: H - 72 };
// The creator avatar overlaps the lower left of the cover.
const AVATAR = { x: SAFE.x, y: H - 148, width: 124, height: 124 };
const COPY_X = SAFE.x + 76;
const BUTTON_X = AVATAR.x + AVATAR.width + 40;

export const buyMeACoffeeCover: SocialTemplate = {
  id: "buy-me-a-coffee-cover",
  platform: "Buy Me a Coffee",
  label: "Page cover",
  width: W,
  height: H,
  description:
    "Page cover, 1200 x 400. The avatar overlaps the lower left, so the copy and the button keep clear of it.",
  safe: SAFE,
  covered: [AVATAR],
  render(ctx) {
    const { surface, content } = ctx;
    const onColor = ctx.layout.background === "auto" || ctx.layout.background === "gradient";
    const on = onColor ? onPrimaryLarge(ctx) : surface.text;
    const accent = onColor ? on : surface.primaryText;
    const maxWidth = SAFE.x + SAFE.width - COPY_X;
    // Long names and headline lines are shortened to fit, even when a single word is wider than the cover.
    const name = truncate(ctx, content.name, maxWidth, 44, "h");
    const tagline = wrap(ctx, content.headline, maxWidth, 22, "b", 2).map((line) =>
      truncate(ctx, line, maxWidth, 22, "b"),
    );
    const cta = content.cta.trim() || "Buy me a coffee";
    const button = pill(
      ctx,
      BUTTON_X,
      H - 150,
      cta,
      22,
      { fill: onColor ? on : surface.primary, text: onColor ? surface.primary : onPrimaryLarge(ctx) },
      SAFE.x + SAFE.width - BUTTON_X,
    );
    // The links stay to the right of the avatar so nothing runs behind it.
    const links = truncate(
      ctx,
      [content.website, content.handle].filter((item) => item.trim()).join("  -  "),
      SAFE.x + SAFE.width - BUTTON_X,
      20,
      "bb",
    );
    const body = `${backdrop(ctx, W, H, () => gradientBackdrop(ctx, W, H))}
      ${logo(ctx, { x: SAFE.x, y: SAFE.y + 4, width: 56, height: 56 }, onColor ? on : undefined, "buymeacoffee-mark")}
      ${text(COPY_X, SAFE.y + 42, name, { size: 44, fill: on, font: "h" })}
      ${tagline.map((line, i) => text(COPY_X, SAFE.y + 88 + i * 26, line, { size: 22, fill: on, opacity: 0.85 })).join("")}
      ${button.markup}
      ${text(SAFE.x + SAFE.width, H - 42, links, { size: 20, fill: accent, font: "bb", anchor: "end", opacity: onColor ? 0.92 : 1 })}`;
    return mockupDoc(ctx, W, H, body);
  },
};
