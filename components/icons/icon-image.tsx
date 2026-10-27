import type { CSSProperties } from "react";

import { buildIconSvg, svgToDataUrl } from "@/lib/icons/svg";
import type { IconData, IconStyle } from "@/types/icons";

type IconImageProps = {
  icon: IconData;
  style: IconStyle;
  alt: string;
  className?: string;
};

/**
 * Renders icon SVG through an <img> data URL. Third-party markup never
 * touches the DOM, so there is nothing to sanitise.
 */
export function IconImage({ icon, style, alt, className }: IconImageProps) {
  // eslint-disable-next-line @next/next/no-img-element -- data URL, nothing for next/image to optimise
  return <img src={svgToDataUrl(buildIconSvg(icon, style))} alt={alt} className={className} draggable={false} />;
}

/** Single-colour icons whose paint is `currentColor` (no hard-coded colours). */
function isMonochrome(icon: IconData): boolean {
  return icon.body.includes("currentColor") && !/#[\da-f]{3,8}\b|rgb\(|hsl\(/i.test(icon.body);
}

/**
 * Theme-proof icon: monochrome icons in `currentColor` are drawn as a CSS mask filled with the
 * text colour, so they are correct in light and dark mode from the very first paint (no JS needed).
 * Everything else (multicolour sets, explicit colours, backgrounds) falls back to <img>.
 */
export function IconGlyph({ icon, style, alt, className }: IconImageProps) {
  const useMask = style.color === "currentColor" && style.background.shape === "none" && isMonochrome(icon);
  if (!useMask) return <IconImage icon={icon} style={style} alt={alt} className={className} />;

  const mask = `url("${svgToDataUrl(buildIconSvg(icon, { ...style, color: "#000" }))}")`;
  const css: CSSProperties = {
    backgroundColor: "currentColor",
    maskImage: mask,
    WebkitMaskImage: mask,
    maskSize: "contain",
    WebkitMaskSize: "contain",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskPosition: "center",
    WebkitMaskPosition: "center",
  };
  return (
    <span
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      className={`inline-block ${className ?? ""}`}
      style={css}
    />
  );
}
