import { lines, logo, mockupDoc, onPrimaryLarge, text, wrap } from "@/lib/mockups/kit";
import { phone, studio } from "@/lib/mockups/templates/devices";
import type { MockupContext, MockupTemplate } from "@/lib/mockups/types";

const W = 390;
const H = 844;

function statusBar(ctx: MockupContext, fill: string): string {
  return `${text(34, 36, "9:41", { size: 16, fill, font: "bb" })}
    <rect x="${W - 76}" y="24" width="24" height="12" rx="3" fill="none" stroke="${fill}" stroke-width="1.5"/>
    <rect x="${W - 74}" y="26" width="17" height="8" rx="1.5" fill="${fill}"/>
    <rect x="${W - 104}" y="28" width="4" height="8" rx="1" fill="${fill}"/><rect x="${W - 98}" y="25" width="4" height="11" rx="1" fill="${fill}"/><rect x="${W - 92}" y="22" width="4" height="14" rx="1" fill="${fill}"/>`;
}

function button(ctx: MockupContext, x: number, y: number, width: number, label: string, primary = true): string {
  const r = Math.min(ctx.brand.radius, 28);
  const { surface } = ctx;
  return `<rect x="${x}" y="${y}" width="${width}" height="56" rx="${r}" fill="${primary ? surface.primary : "none"}"${primary ? "" : ` stroke="${surface.border}" stroke-width="2"`}/>
    ${text(x + width / 2, y + 35, label, { size: 19, fill: primary ? onPrimaryLarge(ctx) : surface.text, font: "bb", anchor: "middle" })}`;
}

export function onboarding(ctx: MockupContext): string {
  const { surface, content, brand } = ctx;
  const onPrimary = onPrimaryLarge(ctx);
  const headline = wrap(ctx, content.headline, W - 64, 34, "h", 3);
  const title = headline
    .map((line, i) => text(32, 560 + i * 40, line, { size: 34, fill: surface.text, font: "h" }))
    .join("");
  return `<defs><linearGradient id="ob" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${surface.primary}"/><stop offset="1" stop-color="${surface.secondary}"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="${surface.background}"/>
    <rect width="${W}" height="480" fill="url(#ob)"/>
    <circle cx="${W - 40}" cy="120" r="140" fill="${onPrimary}" fill-opacity=".08"/>
    ${statusBar(ctx, onPrimary)}
    ${logo(ctx, { x: W / 2 - 64, y: 170, width: 128, height: 128 }, onPrimary, "ob")}
    ${text(W / 2, 360, brand.name, { size: 36, fill: onPrimary, font: "h", anchor: "middle" })}
    ${title}
    <circle cx="32" cy="${H - 170}" r="4" fill="${surface.primary}"/><circle cx="46" cy="${H - 170}" r="4" fill="${surface.border}"/><circle cx="60" cy="${H - 170}" r="4" fill="${surface.border}"/>
    ${button(ctx, 32, H - 136, W - 64, content.cta || "Get started")}
    ${text(W / 2, H - 46, "I already have an account", { size: 15, fill: surface.muted, anchor: "middle" })}`;
}

export function home(ctx: MockupContext): string {
  const { surface, content, brand } = ctx;
  const r = Math.min(brand.radius, 24);
  const first = content.person.split(" ")[0] ?? content.person;
  const cards = [0, 1, 2]
    .map((i) => {
      const y = 430 + i * 104;
      const color = i === 1 ? surface.secondary : surface.primary;
      return `<rect x="24" y="${y}" width="${W - 48}" height="88" rx="${r}" fill="${surface.surface}" stroke="${surface.border}"/>
        <rect x="40" y="${y + 18}" width="52" height="52" rx="${Math.min(r, 14)}" fill="${color}" fill-opacity=".16"/>
        <circle cx="66" cy="${y + 44}" r="10" fill="${color}"/>
        ${text(108, y + 40, ["Weekly report", "Design review", "Launch plan"][i] ?? "", { size: 17, fill: surface.text, font: "bb" })}
        ${text(108, y + 64, ["Updated 2h ago", "Tomorrow, 10:00", "3 tasks left"][i] ?? "", { size: 14, fill: surface.muted })}`;
    })
    .join("");
  const tabs = [0, 1, 2, 3]
    .map((i) => {
      const cx = 48 + i * ((W - 96) / 3);
      return `<rect x="${cx - 11}" y="${H - 64}" width="22" height="22" rx="6" fill="${i === 0 ? surface.primary : surface.muted}" fill-opacity="${i === 0 ? 1 : 0.45}"/>`;
    })
    .join("");
  return `<rect width="${W}" height="${H}" fill="${surface.background}"/>
    ${statusBar(ctx, surface.text)}
    ${logo(ctx, { x: 24, y: 70, width: 34, height: 34 }, undefined, "home")}
    <circle cx="${W - 44}" cy="87" r="20" fill="${surface.surface}" stroke="${surface.border}"/>
    ${text(24, 158, `Hi, ${first}`, { size: 30, fill: surface.text, font: "h" })}
    ${text(24, 186, `Here is what is happening at ${brand.name}.`, { size: 15, fill: surface.muted })}
    <rect x="24" y="214" width="${W - 48}" height="176" rx="${r + 4}" fill="url(#home-card)"/>
    ${text(48, 262, "This week", { size: 15, fill: onPrimaryLarge(ctx), font: "bb", opacity: 0.8 })}
    ${text(48, 312, "82%", { size: 46, fill: onPrimaryLarge(ctx), font: "h" })}
    <rect x="48" y="340" width="${W - 96}" height="10" rx="5" fill="${onPrimaryLarge(ctx)}" fill-opacity=".25"/>
    <rect x="48" y="340" width="${(W - 96) * 0.82}" height="10" rx="5" fill="${onPrimaryLarge(ctx)}"/>
    ${text(24, 416, "Today", { size: 19, fill: surface.text, font: "h" })}
    ${cards}
    <rect y="${H - 96}" width="${W}" height="96" fill="${surface.surface}"/>
    <rect y="${H - 96}" width="${W}" height="1" fill="${surface.border}"/>
    ${tabs}
    <defs><linearGradient id="home-card" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${surface.primary}"/><stop offset="1" stop-color="${surface.secondary}"/></linearGradient></defs>`;
}

export function profile(ctx: MockupContext): string {
  const { surface, content, brand } = ctx;
  const r = Math.min(brand.radius, 20);
  const initials = content.person
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const rows = ["Notifications", "Appearance", "Privacy", "Help"]
    .map((label, i) => {
      const y = 520 + i * 60;
      return `${i ? `<rect x="44" y="${y - 30}" width="${W - 88}" height="1" fill="${surface.border}"/>` : ""}
        ${text(44, y + 6, label, { size: 17, fill: surface.text })}
        <path d="M${W - 56} ${y - 6} l7 7 -7 7" fill="none" stroke="${surface.muted}" stroke-width="2" stroke-linecap="round"/>`;
    })
    .join("");
  return `<rect width="${W}" height="${H}" fill="${surface.background}"/>
    ${statusBar(ctx, surface.text)}
    ${text(W / 2, 100, "Profile", { size: 18, fill: surface.text, font: "bb", anchor: "middle" })}
    <circle cx="${W / 2}" cy="200" r="56" fill="${surface.primary}"/>
    ${text(W / 2, 214, initials, { size: 38, fill: onPrimaryLarge(ctx), font: "h", anchor: "middle" })}
    ${text(W / 2, 294, content.person, { size: 26, fill: surface.text, font: "h", anchor: "middle" })}
    ${text(W / 2, 322, `${content.role} at ${brand.name}`, { size: 15, fill: surface.muted, anchor: "middle" })}
    ${button(ctx, 24, 356, (W - 60) / 2, "Edit")}
    ${button(ctx, 36 + (W - 60) / 2, 356, (W - 60) / 2, "Share", false)}
    <rect x="24" y="470" width="${W - 48}" height="260" rx="${r}" fill="${surface.surface}" stroke="${surface.border}"/>
    ${rows}
    ${lines(24, 770, W - 48, 2, 22, surface.border)}`;
}

export const mobileApp: MockupTemplate = {
  id: "mobile-app",
  label: "Mobile app",
  category: "Devices",
  description: "Onboarding, home and profile screens on phones.",
  render(ctx) {
    const width = 1800;
    const height = 1200;
    const pw = 418;
    const gap = 120;
    const x0 = (width - (pw * 3 + gap * 2)) / 2;
    return mockupDoc(
      ctx,
      width,
      height,
      `${studio(ctx, width, height)}
      ${phone(x0, 190, onboarding(ctx))}
      ${phone(x0 + pw + gap, 130, home(ctx))}
      ${phone(x0 + (pw + gap) * 2, 190, profile(ctx))}`,
    );
  },
};
