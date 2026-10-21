import { logo, mockupDoc, onPrimaryLarge, text, truncate, wrap } from "@/lib/mockups/kit";
import { studio, watch, WATCH_H, WATCH_W } from "@/lib/mockups/templates/devices";
import type { MockupContext, MockupTemplate } from "@/lib/mockups/types";

/** The watch face: the brand mark, the time, the date and an activity ring in the brand colors. */
export function watchFace(ctx: MockupContext): string {
  const { surface, brand } = ctx;
  const on = onPrimaryLarge(ctx);
  const cx = WATCH_W / 2;
  const ring = 84;
  const circumference = 2 * Math.PI * ring;
  return `<rect width="${WATCH_W}" height="${WATCH_H}" fill="#000"/>
    <circle cx="${cx}" cy="${WATCH_H / 2 + 6}" r="${ring}" fill="none" stroke="${surface.primary}" stroke-opacity=".25" stroke-width="12"/>
    <circle cx="${cx}" cy="${WATCH_H / 2 + 6}" r="${ring}" fill="none" stroke="${surface.primary}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${(circumference * 0.72).toFixed(1)} ${circumference.toFixed(1)}" transform="rotate(-90 ${cx} ${WATCH_H / 2 + 6})"/>
    ${logo(ctx, { x: cx - 18, y: 38, width: 36, height: 36 }, on, "watch-face")}
    ${text(cx, WATCH_H / 2 + 28, "9:41", { size: 58, fill: "#ffffff", font: "h", anchor: "middle" })}
    ${text(cx, WATCH_H / 2 + 56, "Mon 12 Oct", { size: 18, fill: "#ffffff", font: "bb", anchor: "middle", opacity: 0.7 })}
    ${text(cx, WATCH_H - 22, truncate(ctx, brand.name, WATCH_W - 40, 15, "bb"), { size: 15, fill: surface.secondary, font: "bb", anchor: "middle" })}`;
}

/** A notification from the app: the mark, the brand name (shortened to fit) and up to three lines of text. */
export function watchNotification(ctx: MockupContext): string {
  const { surface, brand, content } = ctx;
  const on = onPrimaryLarge(ctx);
  const body = content.headline.trim() || `${content.person.split(" ")[0] ?? content.person} replied to your comment.`;
  const lines = wrap(ctx, body, WATCH_W - 36, 19, "b", 3);
  return `<rect width="${WATCH_W}" height="${WATCH_H}" fill="#000"/>
    <rect x="12" y="34" width="32" height="32" rx="${Math.min(brand.radius, 10)}" fill="${surface.primary}"/>
    ${logo(ctx, { x: 18, y: 40, width: 20, height: 20 }, on, "watch-note")}
    ${text(54, 56, truncate(ctx, brand.name, WATCH_W - 54 - 12, 17, "bb"), { size: 17, fill: "#ffffff", font: "bb" })}
    ${lines.map((line, i) => text(18, 98 + i * 25, line, { size: 19, fill: "#ffffff", opacity: 0.92 })).join("")}
    <rect x="14" y="${WATCH_H - 62}" width="${WATCH_W - 28}" height="42" rx="21" fill="${surface.primary}"/>
    ${text(WATCH_W / 2, WATCH_H - 34, truncate(ctx, content.cta.trim() || "Open", WATCH_W - 60, 18, "bb"), { size: 18, fill: on, font: "bb", anchor: "middle" })}`;
}

export const smartwatch: MockupTemplate = {
  id: "smartwatch",
  label: "Smartwatch",
  category: "Screens",
  description: "A watch face with the brand mark and time, and a notification from the app.",
  render(ctx) {
    const width = 1400;
    const height = 1000;
    const caseW = WATCH_W + 36;
    const gap = 260;
    const x0 = (width - (caseW * 2 + gap)) / 2;
    const y = 310;
    return mockupDoc(
      ctx,
      width,
      height,
      `${studio(ctx, width, height)}${watch(x0, y, watchFace(ctx))}${watch(x0 + caseW + gap, y, watchNotification(ctx))}`,
    );
  },
};
