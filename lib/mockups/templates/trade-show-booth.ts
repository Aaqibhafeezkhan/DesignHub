import { logo, mockupDoc, onPrimaryLarge, text, truncate, wrap } from "@/lib/mockups/kit";
import type { MockupContext, MockupTemplate } from "@/lib/mockups/types";

const W = 2000;
const H = 1300;

/** One-point perspective: everything recedes toward this point, so every wall and floor edge is a straight line. */
const VANISH = { x: 1000, y: 420 };
/** The back wall is flat to the camera: a 3 m wide, 1.6 m visible panel. */
const BACK = { x: 520, y: 250, width: 960, height: 490 };
/** The booth sits this far down the canvas, leaving the foreground aisle shorter than the hall behind it. */
const DROP = 130;
/** How much closer to the camera the front edge of the side walls is than the back wall. */
const NEAR = 1.5;

/** A point on the back wall plane moved toward the camera by `scale`. */
function towardCamera(x: number, y: number, scale: number): [number, number] {
  return [Math.round(VANISH.x + (x - VANISH.x) * scale), Math.round(VANISH.y + (y - VANISH.y) * scale)];
}

const polygon = (points: [number, number][]) => points.map(([x, y]) => `${x},${y}`).join(" ");

/** Where each piece of copy sits, so tests can check it stays inside its flat panel. */
export const BOOTH = {
  wallTextWidth: BACK.width - 2 * 90,
  counterTextWidth: 440 - 2 * 24,
  bannerTextWidth: 150 - 2 * 16,
  bannerLines: 5,
};

/** The copy drawn on the three flat panels: the back wall, the counter and the pull-up banner. */
export function boothCopy(ctx: MockupContext) {
  const headline = ctx.content.headline.trim() || ctx.brand.name;
  const wall = wrap(ctx, headline, BOOTH.wallTextWidth, 58, "h", 2).map((line) =>
    truncate(ctx, line, BOOTH.wallTextWidth, 58, "h"),
  );
  const banner = wrap(ctx, headline, BOOTH.bannerTextWidth, 21, "h", BOOTH.bannerLines).map((line) =>
    truncate(ctx, line, BOOTH.bannerTextWidth, 21, "h"),
  );
  return {
    wall,
    banner,
    counterName: truncate(ctx, ctx.brand.name, BOOTH.counterTextWidth, 36, "h"),
    website: truncate(ctx, ctx.content.website, BOOTH.wallTextWidth, 26, "bb"),
  };
}

export const tradeShowBooth: MockupTemplate = {
  id: "trade-show-booth",
  label: "Trade show booth",
  category: "Objects",
  description: "A 3 x 3 m booth in perspective with a back wall graphic, a counter and a pull-up banner.",
  render(ctx) {
    const { surface, mode } = ctx;
    const dark = mode === "dark";
    const on = onPrimaryLarge(ctx);
    const copy = boothCopy(ctx);
    // Hall, carpet and aluminium are scenery, not brand values.
    const [hallTop, hallBottom] = dark ? ["#0b0c10", "#15161b"] : ["#eceae6", "#d6d3cc"];
    const aisle = dark ? "#1c1d23" : "#b9b5ac";
    const metal = dark ? "#3a3d46" : "#c3c6cc";

    const [lx, ltop] = towardCamera(BACK.x, BACK.y, NEAR);
    const [, lbottom] = towardCamera(BACK.x, BACK.y + BACK.height, NEAR);
    const [rx] = towardCamera(BACK.x + BACK.width, BACK.y, NEAR);
    const backBottom = BACK.y + BACK.height;
    const backRight = BACK.x + BACK.width;

    const leftWall: [number, number][] = [
      [BACK.x, BACK.y],
      [BACK.x, backBottom],
      [lx, lbottom],
      [lx, ltop],
    ];
    const rightWall: [number, number][] = [
      [backRight, BACK.y],
      [backRight, backBottom],
      [rx, lbottom],
      [rx, ltop],
    ];
    const floor: [number, number][] = [
      [BACK.x, backBottom],
      [backRight, backBottom],
      [rx, lbottom],
      [lx, lbottom],
    ];

    // The counter stands on the carpet, centred, with a flat front panel and a thin top.
    const counter = { x: 780, y: 690, width: 440, height: 170 };
    const counterTop: [number, number][] = [
      [counter.x, counter.y],
      [counter.x + counter.width, counter.y],
      [counter.x + counter.width - 34, counter.y - 36],
      [counter.x + 34, counter.y - 36],
    ];
    const banner = { x: 1360, y: 392, width: 150, height: 450 };

    const bannerLines = copy.banner
      .map((line, i) => text(banner.x + 16, banner.y + 230 + i * 28, line, { size: 21, fill: on, font: "h" }))
      .join("");
    const wallLines = copy.wall
      .map((line, i) => text(BACK.x + 90, BACK.y + 250 + i * 64, line, { size: 58, fill: on, font: "h" }))
      .join("");

    const defs = `<linearGradient id="tb-hall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${hallTop}"/><stop offset="1" stop-color="${hallBottom}"/></linearGradient>
      <linearGradient id="tb-graphic" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${surface.primary}"/><stop offset="1" stop-color="${surface.secondary}"/></linearGradient>
      <linearGradient id="tb-side" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity=".08"/></linearGradient>
      <linearGradient id="tb-carpet" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="${dark ? 0.1 : 0.04}"/><stop offset="1" stop-color="#000" stop-opacity="${dark ? 0.4 : 0.18}"/></linearGradient>
      <filter id="tb-blur" x="-30%" y="-250%" width="160%" height="600%"><feGaussianBlur stdDeviation="16"/></filter>`;

    const hall = `<rect width="${W}" height="${H}" fill="url(#tb-hall)"/>
      <rect y="${lbottom + DROP}" width="${W}" height="${H - lbottom - DROP}" fill="${aisle}"/>
      <rect y="${lbottom + DROP}" width="${W}" height="${H - lbottom - DROP}" fill="url(#tb-carpet)"/>`;

    const booth = `<g transform="translate(0 ${DROP})"><polygon points="${polygon(floor)}" fill="${surface.secondary}"/>
      <polygon points="${polygon(floor)}" fill="url(#tb-carpet)"/>
      <polygon points="${polygon(leftWall)}" fill="${surface.surface}"/>
      <polygon points="${polygon(leftWall)}" fill="${surface.primary}" fill-opacity=".18"/>
      <polygon points="${polygon(leftWall)}" fill="url(#tb-side)"/>
      <polygon points="${polygon(rightWall)}" fill="${surface.surface}"/>
      <polygon points="${polygon(rightWall)}" fill="${surface.primary}" fill-opacity=".18"/>
      <polygon points="${polygon(rightWall)}" fill="#000" fill-opacity=".14"/>
      <rect x="${BACK.x}" y="${BACK.y}" width="${BACK.width}" height="${BACK.height}" fill="url(#tb-graphic)"/>
      <circle cx="${backRight - 170}" cy="${BACK.y + 130}" r="250" fill="${on}" fill-opacity=".08"/>
      ${logo(ctx, { x: BACK.x + 90, y: BACK.y + 56, width: 96, height: 96 }, on, "tb-wall-mark")}
      ${wallLines}
      ${copy.website ? text(BACK.x + 90, BACK.y + 250 + (copy.wall.length - 1) * 64 + 64, copy.website, { size: 26, fill: on, font: "bb", opacity: 0.9 }) : ""}
      <polyline points="${polygon([leftWall[3]!, leftWall[0]!, rightWall[0]!, rightWall[3]!])}" fill="none" stroke="${metal}" stroke-width="10" stroke-linejoin="round"/>
      <line x1="${BACK.x}" y1="${BACK.y}" x2="${BACK.x}" y2="${backBottom}" stroke="${metal}" stroke-width="8"/>
      <line x1="${backRight}" y1="${BACK.y}" x2="${backRight}" y2="${backBottom}" stroke="${metal}" stroke-width="8"/>
      <ellipse cx="${counter.x + counter.width / 2}" cy="${counter.y + counter.height + 8}" rx="${counter.width / 2 + 50}" ry="22" fill="#000" fill-opacity="${dark ? 0.55 : 0.3}" filter="url(#tb-blur)"/>
      <rect x="${counter.x}" y="${counter.y}" width="${counter.width}" height="${counter.height}" fill="${surface.primary}" filter="url(#soft)"/>
      <rect x="${counter.x}" y="${counter.y}" width="${counter.width}" height="${counter.height}" fill="#000" fill-opacity=".06"/>
      ${logo(ctx, { x: counter.x + 28, y: counter.y + 38, width: 72, height: 72 }, on, "tb-counter-mark")}
      ${text(counter.x + 24 + 84, counter.y + 96, truncate(ctx, ctx.brand.name, BOOTH.counterTextWidth - 84, 36, "h"), { size: 36, fill: on, font: "h" })}
      <polygon points="${polygon(counterTop)}" fill="${dark ? "#e8e8ec" : "#ffffff"}" fill-opacity="${dark ? 0.85 : 1}"/>
      <polygon points="${polygon(counterTop)}" fill="none" stroke="#000" stroke-opacity=".1"/>
      <ellipse cx="${banner.x + banner.width / 2}" cy="${banner.y + banner.height + 14}" rx="120" ry="16" fill="#000" fill-opacity="${dark ? 0.5 : 0.28}" filter="url(#tb-blur)"/>
      <rect x="${banner.x - 14}" y="${banner.y + banner.height}" width="${banner.width + 28}" height="18" rx="6" fill="${metal}"/>
      <rect x="${banner.x}" y="${banner.y}" width="${banner.width}" height="${banner.height}" fill="url(#tb-graphic)" filter="url(#soft)"/>
      <rect x="${banner.x}" y="${banner.y}" width="${banner.width}" height="14" fill="${metal}"/>
      ${logo(ctx, { x: banner.x + 16, y: banner.y + 44, width: 64, height: 64 }, on, "tb-banner-mark")}
      ${bannerLines}</g>`;

    return mockupDoc(ctx, W, H, `${hall}${booth}`, defs);
  },
};
