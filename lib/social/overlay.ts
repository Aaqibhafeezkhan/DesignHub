import type { SocialTemplateInfo } from "@/lib/social/types";

/** Draws the safe area and platform-covered zones on top of a rendered asset, for preview only. */
export function withSafeArea(svg: string, template: SocialTemplateInfo): string {
  const { width, height, safe, covered = [] } = template;
  const stroke = Math.max(2, Math.round(width / 600));
  const shade = `<path d="M0 0H${width}V${height}H0Z M${safe.x} ${safe.y}V${safe.y + safe.height}H${safe.x + safe.width}V${safe.y}Z" fill="#000" fill-opacity=".35" fill-rule="evenodd"/>`;
  const frame = `<rect x="${safe.x}" y="${safe.y}" width="${safe.width}" height="${safe.height}" fill="none" stroke="#22d3ee" stroke-width="${stroke}" stroke-dasharray="${stroke * 6} ${stroke * 4}"/>`;
  const zones = covered
    .map(
      (zone) =>
        `<rect x="${zone.x}" y="${zone.y}" width="${zone.width}" height="${zone.height}" rx="${Math.min(zone.width, zone.height) * 0.08}" fill="#f43f5e" fill-opacity=".35" stroke="#f43f5e" stroke-width="${stroke}"/>`,
    )
    .join("");
  return svg.replace(/<\/svg>\s*$/, `<g pointer-events="none">${shade}${frame}${zones}</g></svg>`);
}
