import { logo, mockupDoc, onPrimaryLarge } from "@/lib/mockups/kit";
import { backdrop, gradientBackdrop } from "@/lib/social/templates/shared";
import type { SocialTemplate } from "@/lib/social/types";

const W = 240;
const H = 240;
// Product Hunt rounds the corners and shows the thumbnail as small as 48 px, so only the mark is drawn.
const SAFE = { x: 24, y: 24, width: W - 48, height: H - 48 };

export const productHuntThumbnail: SocialTemplate = {
  id: "product-hunt-thumbnail",
  platform: "Product Hunt",
  label: "Thumbnail",
  width: W,
  height: H,
  description: "Product thumbnail, 240 × 240, shown next to the product name. Small enough that only the logo reads.",
  safe: SAFE,
  render(ctx) {
    const onColor = ctx.layout.background === "auto" || ctx.layout.background === "gradient";
    const mark = 144;
    const body = `${backdrop(ctx, W, H, () => gradientBackdrop(ctx, W, H))}
      ${logo(ctx, { x: (W - mark) / 2, y: (H - mark) / 2, width: mark, height: mark }, onColor ? onPrimaryLarge(ctx) : undefined, "ph-thumb-mark")}`;
    return mockupDoc(ctx, W, H, body);
  },
};
