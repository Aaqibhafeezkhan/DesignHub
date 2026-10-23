import { logo, mockupDoc, onPrimaryLarge, text, truncate, wrap } from "@/lib/mockups/kit";
import type { MockupContext, MockupTemplate } from "@/lib/mockups/types";

const W = 2000;
const H = 1200;
/** Where the tyres touch the road. */
const GROUND = 902;

/**
 * The van's side in one outline: a tall cargo box, a stepped roof into the cab, a sloped windscreen,
 * a short bonnet and the bumper. The livery is clipped to this path, so it follows every edge.
 */
const BODY =
  "M300 800 V345 Q300 305 340 305 H1215 Q1245 305 1268 322 L1380 408 Q1418 436 1470 446 L1610 474 Q1660 484 1672 532 L1684 640 V800 Z";

/** The flat part of the cargo panel, where the logo and copy go: clear of the curved roof, arches and cab. */
const PANEL = { x: 360, y: 370, width: 790, height: 380 };

export const VAN = { textWidth: PANEL.width - 220, websiteWidth: PANEL.width - 40, nameLines: 2 };

/** The copy drawn on the van's side, shortened to the panel. */
export function vanCopy(ctx: MockupContext) {
  const name = wrap(ctx, ctx.brand.name, VAN.textWidth, 70, "h", VAN.nameLines).map((line) =>
    truncate(ctx, line, VAN.textWidth, 70, "h"),
  );
  return {
    name,
    website: truncate(ctx, ctx.content.website, VAN.websiteWidth, 40, "bb"),
    phone: truncate(ctx, ctx.content.phone, VAN.websiteWidth, 40, "bb"),
  };
}

function wheel(cx: number, ctxDark: boolean): string {
  const tyre = ctxDark ? "#0b0b0d" : "#17181b";
  return `<circle cx="${cx}" cy="810" r="92" fill="${tyre}"/>
    <circle cx="${cx}" cy="810" r="58" fill="${ctxDark ? "#4a4d56" : "#c9ccd2"}"/>
    <circle cx="${cx}" cy="810" r="40" fill="${ctxDark ? "#2a2c33" : "#9da1a9"}"/>
    <circle cx="${cx}" cy="810" r="12" fill="${ctxDark ? "#4a4d56" : "#e6e8ec"}"/>`;
}

export const deliveryVan: MockupTemplate = {
  id: "delivery-van",
  label: "Delivery van",
  category: "Print",
  description: "A delivery van with the brand's livery wrapped around the body, with the name, website and phone.",
  render(ctx) {
    const { surface, mode } = ctx;
    const dark = mode === "dark";
    const on = onPrimaryLarge(ctx);
    const copy = vanCopy(ctx);
    // Sky, road and glass are scenery, not brand values: daylight in light mode, night in dark.
    const [skyTop, skyBottom] = dark ? ["#070912", "#1b1f2e"] : ["#cfdbe6", "#eef1f2"];
    const [roadTop, roadBottom] = dark ? ["#17181d", "#0a0b0d"] : ["#8c8f95", "#6f7278"];
    const glass = dark ? "#10131c" : "#9fb3c4";

    const nameLines = copy.name
      .map((line, i) =>
        text(PANEL.x + 220, PANEL.y + 110 + 24 - ((copy.name.length - 1) * 78) / 2 + i * 78, line, {
          size: 70,
          fill: on,
          font: "h",
        }),
      )
      .join("");
    const contactY = PANEL.y + PANEL.height - 150;

    const defs = `<linearGradient id="van-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${skyTop}"/><stop offset="1" stop-color="${skyBottom}"/></linearGradient>
      <linearGradient id="van-road" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${roadTop}"/><stop offset="1" stop-color="${roadBottom}"/></linearGradient>
      <linearGradient id="van-livery" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${surface.primary}"/><stop offset="1" stop-color="${surface.secondary}"/></linearGradient>
      <linearGradient id="van-shade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity="${dark ? 0.12 : 0.28}"/>
        <stop offset=".35" stop-color="#fff" stop-opacity="0"/>
        <stop offset=".8" stop-color="#000" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity=".3"/>
      </linearGradient>
      <clipPath id="van-body"><path d="${BODY}"/></clipPath>
      <filter id="van-blur" x="-30%" y="-250%" width="160%" height="600%"><feGaussianBlur stdDeviation="18"/></filter>`;

    const scene = `<rect width="${W}" height="${GROUND}" fill="url(#van-sky)"/>
      ${dark ? "" : `<circle cx="1700" cy="170" r="70" fill="#fff" fill-opacity=".7"/>`}
      <rect y="${GROUND - 70}" width="${W}" height="70" fill="${dark ? "#0e1018" : "#c3ccd2"}"/>
      <rect y="${GROUND}" width="${W}" height="${H - GROUND}" fill="url(#van-road)"/>
      <path d="M0 1070 H${W}" stroke="#fff" stroke-opacity="${dark ? 0.3 : 0.65}" stroke-width="8" stroke-dasharray="90 70"/>`;

    // The wrap: the whole body in the brand gradient with sweeping shapes over it, clipped to the body so
    // they follow its line. Text always sits on the brand color, so it keeps its contrast.
    const livery = `<g clip-path="url(#van-body)">
        <rect x="280" y="290" width="1420" height="520" fill="url(#van-livery)"/>
        <path d="M280 590 Q760 450 1150 610 T1700 560 V820 H280 Z" fill="${on}" fill-opacity=".12"/>
        <path d="M280 700 Q820 610 1200 726 T1700 696 V820 H280 Z" fill="#000" fill-opacity=".14"/>
        <path d="M280 300 H1300 Q1220 350 1000 360 Q560 376 280 346 Z" fill="${on}" fill-opacity=".16"/>
        <rect x="280" y="290" width="1420" height="520" fill="url(#van-shade)"/>
      </g>`;

    const cab = `<path d="M1262 345 L1352 410 Q1380 432 1418 442 L1470 452 H1262 Z" fill="${glass}" stroke="#1d1e22" stroke-width="6" stroke-linejoin="round"/>
      <path d="M1262 345 L1352 410 Q1380 432 1418 442 L1470 452 H1262 Z" fill="#fff" fill-opacity="${dark ? 0.05 : 0.22}"/>
      <path d="M1262 330 V800" stroke="#000" stroke-opacity=".28" stroke-width="3"/>
      <rect x="1288" y="560" width="46" height="9" rx="4.5" fill="#1d1e22" fill-opacity=".7"/>
      <path d="M1480 462 L1498 392 H1530 L1512 470 Z" fill="#1d1e22"/>
      <rect x="1636" y="540" width="46" height="26" rx="10" fill="${dark ? "#fff3c6" : "#fff9e1"}"/>
      <rect x="1668" y="700" width="30" height="100" rx="8" fill="${dark ? "#2d2f37" : "#3a3c44"}"/>
      <rect x="1646" y="758" width="52" height="20" rx="6" fill="${dark ? "#2d2f37" : "#3a3c44"}"/>`;

    const van = `<ellipse cx="1000" cy="${GROUND + 4}" rx="780" ry="26" fill="#000" fill-opacity="${dark ? 0.6 : 0.35}" filter="url(#van-blur)"/>
      <path d="${BODY}" fill="#fff" filter="url(#soft)"/>
      ${livery}
      <path d="${BODY}" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="3"/>
      <rect x="296" y="770" width="1394" height="34" rx="8" fill="${dark ? "#202228" : "#2c2e35"}"/>
      ${cab}
      ${logo(ctx, { x: PANEL.x + 20, y: PANEL.y + 30, width: 160, height: 160 }, on, "van-mark")}
      ${nameLines}
      ${copy.website ? text(PANEL.x + 20, contactY, copy.website, { size: 40, fill: on, font: "bb" }) : ""}
      ${copy.phone ? text(PANEL.x + 20, contactY + 58, copy.phone, { size: 40, fill: on, font: "bb", opacity: 0.9 }) : ""}
      <g clip-path="url(#van-body)"><circle cx="520" cy="810" r="108" fill="#15161a"/><circle cx="1450" cy="810" r="108" fill="#15161a"/></g>
      ${wheel(520, dark)}
      ${wheel(1450, dark)}`;

    return mockupDoc(ctx, W, H, `${scene}${van}`, defs);
  },
};
