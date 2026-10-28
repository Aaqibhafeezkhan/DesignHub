import { nestLogo } from "@/lib/logo/compose";
import { renderVariant, variantContext } from "@/lib/logo/variants";
import { mockupDoc, onPrimaryLarge, text, truncate, wrap } from "@/lib/mockups/kit";
import { phone, studio } from "@/lib/mockups/templates/devices";
import type { MockupContext, MockupTemplate } from "@/lib/mockups/types";

/** Phone screen size in logical points. */
const W = 390;
const H = 844;
const NOTE_X = 16;
const NOTE_W = W - NOTE_X * 2;
const ICON = 40;

/** One notification: the app icon variant, the brand name, a time and up to two lines of body. */
function notification(
  ctx: MockupContext,
  icon: string,
  y: number,
  when: string,
  title: string,
  body: string,
  id: string,
) {
  const { surface, brand } = ctx;
  const dark = ctx.mode === "dark";
  const textX = NOTE_X + 14 + ICON + 12;
  const textWidth = NOTE_X + NOTE_W - 14 - textX;
  const lines = wrap(ctx, body, textWidth, 14, "b", 2);
  const height = 28 + ICON / 2 + 26 + lines.length * 18;
  const whenWidth = ctx.measure(when, brand.typography.body, 400, 12);
  const name = truncate(ctx, title, textWidth - whenWidth - 12, 14, "bb");
  const markup = `<rect x="${NOTE_X}" y="${y}" width="${NOTE_W}" height="${height}" rx="24" fill="${surface.surface}" fill-opacity="${dark ? 0.72 : 0.82}" stroke="${surface.border}" stroke-opacity=".6"/>
    ${nestLogo(icon, { x: NOTE_X + 14, y: y + 14, width: ICON, height: ICON }, id)}
    ${text(textX, y + 30, name, { size: 14, fill: surface.text, font: "bb" })}
    ${text(NOTE_X + NOTE_W - 14, y + 30, when, { size: 12, fill: surface.muted, anchor: "end" })}
    ${lines.map((line, i) => text(textX, y + 52 + i * 18, line, { size: 14, fill: surface.text, opacity: 0.85 })).join("")}`;
  return { markup, height };
}

/** The lock screen at 390 x 844: wallpaper, date, time, two notifications and the bottom shortcuts. */
function lockScreen(ctx: MockupContext): string {
  const { surface, brand, content } = ctx;
  const dark = ctx.mode === "dark";
  const on = onPrimaryLarge(ctx);
  const { heading, headingWeight } = brand.typography;
  // The notification icon is the app icon variant, exactly as the logo pack exports it.
  const icon = renderVariant(
    "app-icon",
    variantContext(brand, ctx.fontCss, (value, size) => ctx.measure(value, heading, headingWeight, size)),
  );
  const first = notification(
    ctx,
    icon,
    380,
    "now",
    brand.name,
    content.headline.trim() || `Welcome to ${brand.name}`,
    "lock-n1",
  );
  const second = notification(
    ctx,
    icon,
    380 + first.height + 10,
    "12m ago",
    brand.name,
    `${content.person.split(" ")[0] ?? content.person} replied to your comment in Design review.`,
    "lock-n2",
  );
  const shortcut = (cx: number, glyph: string) =>
    `<circle cx="${cx}" cy="${H - 76}" r="26" fill="${dark ? "#000" : "#fff"}" fill-opacity="${dark ? 0.4 : 0.35}"/>${glyph}`;
  const stroke = `fill="none" stroke="${on}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
  return `<defs>
      <linearGradient id="lock-wall" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${surface.primary}"/><stop offset="1" stop-color="${surface.secondary}"/></linearGradient>
      <radialGradient id="lock-glow" cx=".8" cy=".12" r=".7"><stop offset="0" stop-color="${on}" stop-opacity=".28"/><stop offset="1" stop-color="${on}" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#lock-wall)"/>
    <rect width="${W}" height="${H}" fill="url(#lock-glow)"/>
    <circle cx="${W * 0.1}" cy="${H * 0.92}" r="190" fill="${on}" fill-opacity=".08"/>
    <rect width="${W}" height="${H}" fill="#000" fill-opacity="${dark ? 0.35 : 0}"/>
    <path d="M${W / 2 - 9} 84 v-6 a9 9 0 0 1 18 0 v6" ${stroke}/><rect x="${W / 2 - 12}" y="84" width="24" height="18" rx="4" fill="${on}"/>
    ${text(W / 2, 140, "Monday, 12 October", { size: 19, fill: on, font: "bb", anchor: "middle", opacity: 0.9 })}
    ${text(W / 2, 236, "9:41", { size: 100, fill: on, font: "h", anchor: "middle" })}
    ${first.markup}
    ${second.markup}
    ${shortcut(54, `<path d="M46 ${H - 90} h16 l-3 12 h-10 z M50 ${H - 78} v14 h8 v-14" ${stroke}/>`)}
    ${shortcut(W - 54, `<rect x="${W - 66}" y="${H - 88}" width="24" height="18" rx="4" ${stroke}/><circle cx="${W - 54}" cy="${H - 79}" r="5" ${stroke}/>`)}
    <rect x="${W / 2 - 67}" y="${H - 14}" width="134" height="5" rx="2.5" fill="${on}" fill-opacity=".85"/>`;
}

export const lockScreenMockup: MockupTemplate = {
  id: "lock-screen",
  label: "Lock screen",
  category: "Devices",
  description: "A phone lock screen with a brand wallpaper, the time and two notifications from the app.",
  render(ctx) {
    const width = 1000;
    const height = 1360;
    const scale = 1.3;
    const pw = (W + 28) * scale;
    return mockupDoc(
      ctx,
      width,
      height,
      `${studio(ctx, width, height)}${phone((width - pw) / 2, 110, lockScreen(ctx), scale)}`,
    );
  },
};
