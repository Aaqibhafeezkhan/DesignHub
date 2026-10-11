import { parseColor, toHex } from "@/lib/color/color";
import { parseSvg } from "@/lib/svg/parse";
import { minify } from "@/lib/svg/serialize";
import type { SvgNode } from "@/types/svg";

const PAINT_ATTRIBUTES = ["fill", "stroke", "stop-color", "flood-color", "color"];
const SKIP = /^(none|transparent|currentcolor|inherit|url\()/i;

/** Normalises any CSS color to lowercase 6-digit hex, or null for non-colors. */
function normalize(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || SKIP.test(trimmed)) return null;
  const parsed = parseColor(trimmed);
  return parsed ? toHex({ ...parsed, alpha: 1 }) : null;
}

type PaintVisitor = (value: string) => string;

const PAINT_PROPERTY = "fill|stroke|stop-color|flood-color|color";
const STYLE_ATTRIBUTE_DECLARATION = new RegExp(`(^|;)\\s*(${PAINT_PROPERTY})\\s*:\\s*([^;]+)`, "gi");
/** A paint declaration inside a stylesheet rule: `{ fill: #e94e1b; }` or `; stroke: red !important }`. */
const STYLESHEET_DECLARATION = new RegExp(`([{;]\\s*)(${PAINT_PROPERTY})(\\s*:\\s*)([^;{}]+)`, "gi");
/** Splits a declaration value into the color, an optional `!important` and trailing whitespace. */
const DECLARATION_VALUE = /^([\s\S]*?)(\s*!\s*important)?(\s*)$/i;
/** Stylesheet text is written back verbatim, so only plain color tokens may go into it. */
const CSS_COLOR_TOKEN = /^[#\w\s(),.%+-]+$/;

function rewriteStylesheet(css: string, visit: PaintVisitor): string {
  return css.replace(
    STYLESHEET_DECLARATION,
    (match, lead: string, property: string, separator: string, value: string) => {
      const [, color = value, important = "", trailing = ""] = value.match(DECLARATION_VALUE) ?? [];
      const next = visit(color).trim();
      if (!CSS_COLOR_TOKEN.test(next)) return match;
      return `${lead}${property}${separator}${next}${important}${trailing}`;
    },
  );
}

function walkPaints(node: SvgNode, visit: PaintVisitor): void {
  for (const name of PAINT_ATTRIBUTES) {
    const value = node.attributes[name];
    if (value !== undefined) node.attributes[name] = visit(value);
  }
  const style = node.attributes.style;
  if (style) {
    node.attributes.style = style.replace(
      STYLE_ATTRIBUTE_DECLARATION,
      (_, lead: string, property: string, value: string) => {
        // Keep `!important` out of the color itself, and put it back after the new one.
        const [, color = value, important = ""] = value.match(/^(.*?)\s*(!\s*important)?\s*$/i) ?? [];
        return `${lead}${property}:${visit(color)}${important && ` ${important}`}`;
      },
    );
  }
  // Illustrator and other editors color shapes through classes in a <style> element.
  if (node.name === "style") {
    node.children.forEach((child) => {
      if (child.type === "text") child.value = rewriteStylesheet(child.value, visit);
    });
    return;
  }
  node.children.forEach((child) => walkPaints(child, visit));
}

/** Distinct paint colors in document order. */
export function extractColors(svg: string): string[] {
  const parsed = parseSvg(svg);
  if (!parsed.ok) return [];
  const seen: string[] = [];
  walkPaints(structuredClone(parsed.root), (value) => {
    const hex = normalize(value);
    if (hex && !seen.includes(hex)) seen.push(hex);
    return value;
  });
  return seen;
}

/** Replaces colors according to `map` (keys are normalised hex). */
export function recolorSvg(svg: string, map: Record<string, string>): string {
  const parsed = parseSvg(svg);
  if (!parsed.ok) return svg;
  const root = structuredClone(parsed.root);
  walkPaints(root, (value) => {
    const hex = normalize(value);
    return hex && map[hex] ? map[hex] : value;
  });
  return minify(root);
}

/** Every visible paint becomes one color; `none` and gradient references are kept. */
export function monochromeSvg(svg: string, color: string): string {
  const parsed = parseSvg(svg);
  if (!parsed.ok) return svg;
  const root = structuredClone(parsed.root);
  walkPaints(root, (value) => (SKIP.test(value.trim()) && !/^currentcolor$/i.test(value.trim()) ? value : color));
  // An element with no fill at all paints black by default, so make that explicit too.
  if (!root.attributes.fill) root.attributes.fill = color;
  return minify(root);
}
