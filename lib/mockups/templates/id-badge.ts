import { hashString } from "@/lib/brand/logo";
import { desk, escapeXml, logo, mockupDoc, onPrimaryLarge, rotate, text } from "@/lib/mockups/kit";
import type { MockupTemplate } from "@/lib/mockups/types";

const W = 1400;
const H = 1400;
const BW = 560;
const BH = 860;

/** A 9 x 9 QR-like grid seeded from the text, so it is stable and looks plausible (it doesn't scan). */
function codeGrid(seed: string, x: number, y: number, size: number, color: string): string {
  let state = hashString(seed) || 1;
  const next = () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
  const cells = 9;
  const cell = size / cells;
  let out = "";
  for (let row = 0; row < cells; row += 1) {
    for (let col = 0; col < cells; col += 1) {
      const finder = (row < 3 && col < 3) || (row < 3 && col > 5) || (row > 5 && col < 3);
      if (finder ? !(row % 6 === 1 && col % 6 === 1) : next() > 0.5) {
        out += `<rect x="${x + col * cell}" y="${y + row * cell}" width="${cell}" height="${cell}" fill="${color}"/>`;
      }
    }
  }
  return out;
}

export const idBadge: MockupTemplate = {
  id: "id-badge",
  label: "ID badge",
  category: "Objects",
  description: "Event or team badge on a lanyard.",
  render(ctx) {
    const { surface, content, brand } = ctx;
    const on = onPrimaryLarge(ctx);
    const r = Math.min(brand.radius + 8, 32);
    const initials = content.person
      .split(/\s+/)
      .map((part) => part[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase();

    // The strap repeats the brand name along both sides, running up out of frame.
    const strapText = escapeXml(`${brand.name.toUpperCase()}  ·  `.repeat(12));
    // Each strap is anchored at the clip and rotated so it runs up and out of the frame.
    const strap = (cx: number, cy: number, angle: number) => `<g transform="rotate(${angle} ${cx} ${cy})">
        <rect x="${cx - 26}" y="${cy - 1000}" width="52" height="1000" fill="${surface.primary}"/>
        <rect x="${cx - 26}" y="${cy - 1000}" width="52" height="1000" fill="#000" fill-opacity=".12"/>
        <text transform="translate(${cx - 7} ${cy - 20}) rotate(-90)" class="bb" font-size="18" letter-spacing="3" fill="${on}" fill-opacity=".85">${strapText}</text>
      </g>`;

    const badge = `<g filter="url(#soft)"><rect width="${BW}" height="${BH}" rx="${r}" fill="${surface.background}"/></g>
      <clipPath id="badge-clip"><rect width="${BW}" height="${BH}" rx="${r}"/></clipPath>
      <g clip-path="url(#badge-clip)">
        <rect width="${BW}" height="250" fill="${surface.primary}"/>
        <rect y="${BH - 22}" width="${BW}" height="22" fill="${surface.primary}"/>
      </g>
      <rect x="${BW / 2 - 50}" y="30" width="100" height="18" rx="9" fill="${surface.background}" fill-opacity=".9"/>
      ${logo(ctx, { x: BW / 2 - 44, y: 84, width: 88, height: 88 }, on, "badge-mark")}
      ${text(BW / 2, 214, brand.name, { size: 30, fill: on, font: "h", anchor: "middle" })}
      <circle cx="${BW / 2}" cy="360" r="96" fill="${surface.surface}" stroke="${surface.background}" stroke-width="10"/>
      ${text(BW / 2, 384, initials, { size: 64, fill: surface.primaryText, font: "h", anchor: "middle" })}
      ${text(BW / 2, 530, content.person, { size: 44, fill: surface.text, font: "h", anchor: "middle" })}
      ${text(BW / 2, 574, content.role, { size: 22, fill: surface.muted, anchor: "middle" })}
      <rect x="60" y="620" width="${BW - 120}" height="1.5" fill="${surface.border}"/>
      ${codeGrid(`${content.person}${brand.name}`, 60, 660, 130, surface.text)}
      ${text(BW - 60, 700, "TEAM", { size: 16, fill: surface.muted, font: "bb", anchor: "end", spacing: 4 })}
      ${text(BW - 60, 740, content.website, { size: 20, fill: surface.primaryText, font: "bb", anchor: "end" })}
      ${text(BW - 60, 776, content.email, { size: 16, fill: surface.muted, anchor: "end" })}`;

    const bx = (W - BW) / 2;
    const by = 360;
    const clip = `<rect x="${W / 2 - 34}" y="${by - 70}" width="68" height="84" rx="14" fill="#b9bcc4"/>
      <rect x="${W / 2 - 18}" y="${by - 52}" width="36" height="30" rx="8" fill="#8d9098"/>`;
    return mockupDoc(
      ctx,
      W,
      H,
      `${desk(ctx, W, H)}
      ${strap(W / 2 - 20, by - 40, -18)}${strap(W / 2 + 20, by - 40, 18)}
      ${rotate(-4, W / 2, by + BH / 2, `${clip}<g transform="translate(${bx} ${by})">${badge}</g>`)}`,
    );
  },
};
