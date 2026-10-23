import { desk, logo, mockupDoc, onPrimaryLarge, text, textWidth, truncate } from "@/lib/mockups/kit";
import type { MockupContext, MockupTemplate } from "@/lib/mockups/types";

const W = 1400;
const H = 1700;
/** The cover: a portrait hardcover with the spine on the left. */
const COVER = { x: 310, y: 240, width: 720, height: 1000 };
const PAD = 70;
/** The brand name and the website must stay inside the cover with room to the elastic band. */
export const NOTEBOOK_TEXT_WIDTH = COVER.width - PAD * 2 - 90;

/** The copy on the cover, shortened to fit: the brand name and the website. */
export function notebookCopy(ctx: MockupContext): { name: string; website: string } {
  return {
    name: truncate(ctx, ctx.brand.name, NOTEBOOK_TEXT_WIDTH, 46, "h", 2),
    website: truncate(ctx, ctx.content.website, NOTEBOOK_TEXT_WIDTH, 24, "bb", 2),
  };
}

/** Width the name takes when drawn, for tests. */
export function notebookNameWidth(ctx: MockupContext): number {
  return textWidth(ctx, notebookCopy(ctx).name, 46, "h", 2);
}

export const notebook: MockupTemplate = {
  id: "notebook",
  label: "Notebook",
  category: "Print",
  description: "A hardcover notebook with the logo debossed, the name on the cover and an elastic band.",
  render(ctx) {
    const { surface, mode } = ctx;
    const dark = mode === "dark";
    const on = onPrimaryLarge(ctx);
    const { x, y, width, height } = COVER;
    const right = x + width;
    const bottom = y + height;
    const copy = notebookCopy(ctx);

    // Cover outline: a tight radius at the spine, a softer one on the open edges.
    const outline = `M${x + 10} ${y} H${right - 26} Q${right} ${y} ${right} ${y + 26} V${bottom - 26} Q${right} ${bottom} ${right - 26} ${bottom} H${x + 10} Q${x} ${bottom} ${x} ${bottom - 10} V${y + 10} Q${x} ${y} ${x + 10} ${y} Z`;
    const markSize = 220;
    const markX = x + PAD;
    const markY = y + 190;
    // Debossing: the pressed mark is a little darker than the cover with a light edge below and right.
    const deboss = (id: string) =>
      `<g opacity=".3">${logo(ctx, { x: markX + 3, y: markY + 3, width: markSize, height: markSize }, "#ffffff", `${id}-hi`)}</g>
      <g opacity=".28">${logo(ctx, { x: markX, y: markY, width: markSize, height: markSize }, "#000000", `${id}-lo`)}</g>`;

    const bandX = right - 120;
    const pages = Array.from({ length: 9 }, (_, i) => {
      const offset = 6 + i * 2;
      return `<path d="M${right + 2} ${y + 14 + offset} V${bottom + offset - 4} H${x + 24} " fill="none" stroke="${dark ? "#2d2e34" : "#cfcac1"}" stroke-width="1.5"/>`;
    }).join("");

    const defs = `<linearGradient id="nb-spine" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#000" stop-opacity=".32"/>
        <stop offset=".05" stop-color="#fff" stop-opacity=".12"/>
        <stop offset=".11" stop-color="#000" stop-opacity=".18"/>
        <stop offset=".16" stop-color="#000" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity=".1"/>
      </linearGradient>
      <linearGradient id="nb-sheen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity="${dark ? 0.08 : 0.16}"/>
        <stop offset=".5" stop-color="#fff" stop-opacity="0"/>
        <stop offset="1" stop-color="#000" stop-opacity=".16"/>
      </linearGradient>
      <linearGradient id="nb-band" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#000" stop-opacity=".22"/>
        <stop offset=".3" stop-color="#fff" stop-opacity=".16"/>
        <stop offset="1" stop-color="#000" stop-opacity=".26"/>
      </linearGradient>
      <clipPath id="nb-clip"><path d="${outline}"/></clipPath>
      <filter id="nb-blur" x="-30%" y="-250%" width="160%" height="600%"><feGaussianBlur stdDeviation="26"/></filter>`;

    const book = `<ellipse cx="${x + width / 2 + 24}" cy="${bottom + 36}" rx="${width / 2 + 60}" ry="34" fill="#000" fill-opacity="${dark ? 0.55 : 0.28}" filter="url(#nb-blur)"/>
      <path d="M${x + 24} ${y + 14} H${right + 14} Q${right + 22} ${y + 14} ${right + 22} ${y + 26} V${bottom - 8} Q${right + 22} ${bottom + 8} ${right + 10} ${bottom + 8} H${x + 24} Z" fill="${dark ? "#1f2025" : "#f1ede4"}"/>
      ${pages}
      <path d="${outline}" fill="${surface.primary}" filter="url(#soft)"/>
      <g clip-path="url(#nb-clip)">
        <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="url(#nb-sheen)"/>
        <rect x="${bandX}" y="${y - 2}" width="34" height="${height + 4}" fill="${surface.secondary}"/>
        <rect x="${bandX}" y="${y - 2}" width="34" height="${height + 4}" fill="url(#nb-band)"/>
        <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="url(#nb-spine)"/>
        <rect x="${x + 70}" y="${y + 40}" width="3" height="${height - 80}" fill="#000" fill-opacity=".14"/>
      </g>
      ${deboss("nb-mark")}
      ${text(x + PAD, y + 520, copy.name, { size: 46, fill: on, font: "h", spacing: 2 })}
      <rect x="${x + PAD}" y="${y + 556}" width="90" height="6" rx="3" fill="${on}" fill-opacity=".7"/>
      ${text(x + PAD, bottom - 70, copy.website, { size: 24, fill: on, font: "bb", spacing: 2, opacity: 0.85 })}`;

    return mockupDoc(ctx, W, H, `${desk(ctx, W, H)}${book}`, defs);
  },
};
