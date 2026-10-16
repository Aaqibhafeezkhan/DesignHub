import { escapeAttribute } from "@/lib/svg/serialize";
import type { SvgNode } from "@/types/svg";

/**
 * Inline event handlers (onclick and friends) are dropped, and attribute names are limited to plain
 * XML names. Astro's own directives (set:html, client:load, is:inline, class:list, define:vars,
 * transition:name, server:defer) would be run by the compiler instead of being written out, so
 * they are dropped too.
 */
const UNSAFE = /^on/i;
const XML_NAME = /^[A-Za-z_][\w:.-]*$/;
const DIRECTIVE = /^(?:set|client|is|class|define|transition|server):/i;

function attributes(node: SvgNode): string {
  return Object.entries(node.attributes)
    .filter(([name]) => XML_NAME.test(name) && !UNSAFE.test(name) && !DIRECTIVE.test(name))
    .map(([name, value]) => ` ${name}="${escapeAttribute(value)}"`)
    .join("");
}

/** Scripts are dropped, and so are namespaced editor elements (sodipodi:namedview). */
function visible(node: SvgNode): SvgNode[] {
  return node.children.filter(
    (child) => !(child.type === "element" && (child.name === "script" || child.name.includes(":"))),
  );
}

/**
 * Braces open an expression anywhere in Astro markup, so they are written as entities. A <style>
 * body is raw text and is left alone (CDATA wrappers, which CSS doesn't understand, are removed).
 */
const escapeBraces = (value: string) => value.replace(/[{}]/g, (brace) => (brace === "{" ? "&#123;" : "&#125;"));
const cssText = (value: string) => value.replace(/<!\[CDATA\[|\]\]>/g, "");

/** svgson keeps text escaped, so only braces need encoding. */
function text(node: SvgNode, raw: boolean): string {
  return raw ? cssText(node.value) : escapeBraces(node.value);
}

/** Astro hoists and scopes a plain <style>; is:inline keeps the CSS unscoped and where it is written. */
function open(node: SvgNode): string {
  return `<${node.name}${node.name === "style" ? " is:inline" : ""}${attributes(node)}`;
}

function inline(node: SvgNode, raw = false): string {
  if (node.type === "text") return text(node, raw).trim();
  const children = visible(node)
    .map((child) => inline(child, node.name === "style"))
    .join("");
  return children ? `${open(node)}>${children}</${node.name}>` : `${open(node)} />`;
}

function markup(node: SvgNode, depth: number): string {
  const pad = "  ".repeat(depth);
  if (node.type === "text") return `${pad}${text(node, false).trim()}`;
  const children = visible(node);
  if (children.length === 0) return `${pad}${open(node)} />`;
  // Elements with text content stay on one line so whitespace isn't altered.
  if (children.some((child) => child.type === "text"))
    return `${pad}${open(node)}>${children.map((child) => inline(child, node.name === "style")).join("")}</${node.name}>`;
  return `${pad}${open(node)}>\n${children.map((child) => markup(child, depth + 1)).join("\n")}\n${pad}</${node.name}>`;
}

/**
 * Astro component with a `size` prop (default 1em) and an optional `title`, the accessible name
 * (without it the SVG is decorative). The rest of the props (class, style, width) are spread onto
 * the <svg>. Braces are written as entities, <style> gets is:inline, and scripts and inline event
 * handlers are dropped.
 */
export function astroComponent(root: SvgNode): string {
  const tree = structuredClone(root);
  for (const attribute of ["width", "height", "role", "aria-hidden", "aria-label"]) delete tree.attributes[attribute];
  const body = visible(tree)
    .map((child) => markup(child, 1))
    .join("\n");

  return `---
import type { HTMLAttributes } from "astro/types";

interface Props extends HTMLAttributes<"svg"> {
  /** Width and height. The default follows the surrounding font size. */
  size?: string | number;
}

const { size = "1em", title, ...rest } = Astro.props;
---

<svg${attributes(tree)} width={size} height={size} role={title ? "img" : undefined} aria-hidden={title ? undefined : "true"} {...rest}>
  {title && <title>{title}</title>}${body ? `\n${body}` : ""}
</svg>
`;
}
