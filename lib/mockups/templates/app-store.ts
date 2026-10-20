import { mockupDoc, onPrimaryLarge, text, truncate, wrap } from "@/lib/mockups/kit";
import { home, onboarding, profile } from "@/lib/mockups/templates/mobile-app";
import { phone } from "@/lib/mockups/templates/devices";
import type { MockupContext, MockupTemplate } from "@/lib/mockups/types";

const WIDTH = 1800;
const HEIGHT = 1320;
const PHONE_WIDTH = 418;
const GAP = 120;
const CAPTION_SIZE = 40;
const CAPTION_LINE = 50;
const CAPTION_LINES = 3;
const CAPTION_WIDTH = PHONE_WIDTH + 70;
const PHONE_TOP = 340;

/**
 * The three captions, from the mockup copy fields: the headline (or a welcome line), the call to
 * action and the title. Each wraps to at most `CAPTION_LINES` lines and never runs wider than its phone's column.
 */
export function storeCaptions(ctx: MockupContext): string[] {
  const { content, brand } = ctx;
  return [
    content.headline.trim() || `Welcome to ${brand.name}`,
    content.cta.trim() || "Get started",
    content.role.trim() || "Made for you",
  ];
}

/** One caption's wrapped lines, each shortened to the column. */
export function captionLines(ctx: MockupContext, caption: string): string[] {
  return wrap(ctx, caption, CAPTION_WIDTH, CAPTION_SIZE, "h", CAPTION_LINES).map((line) =>
    truncate(ctx, line, CAPTION_WIDTH, CAPTION_SIZE, "h"),
  );
}

export const appStoreScreenshots: MockupTemplate = {
  id: "app-store",
  label: "App store screenshots",
  category: "Screens",
  description: "Three phones on a brand background, each with a caption above it, as in a store listing.",
  render(ctx) {
    const { surface } = ctx;
    const on = onPrimaryLarge(ctx);
    const x0 = (WIDTH - (PHONE_WIDTH * 3 + GAP * 2)) / 2;
    const screens = [onboarding(ctx), home(ctx), profile(ctx)];
    const captions = storeCaptions(ctx);
    const columns = screens
      .map((screen, i) => {
        const x = x0 + i * (PHONE_WIDTH + GAP);
        const lines = captionLines(ctx, captions[i]!);
        // Captions sit on a common baseline grid, bottom-aligned so one-line captions hug their phone.
        const top = PHONE_TOP - 50 - (lines.length - 1) * CAPTION_LINE;
        return (
          lines
            .map((line, j) =>
              text(x + PHONE_WIDTH / 2, top + j * CAPTION_LINE, line, {
                size: CAPTION_SIZE,
                fill: on,
                font: "h",
                anchor: "middle",
              }),
            )
            .join("") + phone(x, PHONE_TOP, screen)
        );
      })
      .join("");
    return mockupDoc(
      ctx,
      WIDTH,
      HEIGHT,
      `<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#store-bg)"/>
      <circle cx="${WIDTH - 160}" cy="140" r="360" fill="${on}" fill-opacity=".07"/>
      <circle cx="140" cy="${HEIGHT - 80}" r="300" fill="${on}" fill-opacity=".06"/>
      ${columns}`,
      `<linearGradient id="store-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${surface.primary}"/><stop offset="1" stop-color="${surface.secondary}"/></linearGradient>`,
    );
  },
};
