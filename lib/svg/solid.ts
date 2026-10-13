import { componentNameFromFile } from "@/lib/svg/jsx";
import { escapeAttribute } from "@/lib/svg/serialize";
import type { SvgNode } from "@/types/svg";

/**
 * Attributes Solid would treat as code instead of a string: event handlers (onclick) and the
 * properties that write markup or take a ref (innerHTML, textContent, ref). Its namespaced forms
 * (on:click, use:x, prop:x) fail the name check below. The Qwik converter shares this list.
 */
const SPECIAL = /^(?:on|ref$|key$|classList$|innerHTML$|innerText$|textContent$|children$|dangerouslySetInnerHTML$)/i;

/**
 * A JSX attribute name Solid's types accept: an identifier with hyphens and no namespace. Solid
 * types no namespaced SVG attributes (xml:space, sodipodi:docname), so only xlink:href is kept,
 * as the SVG 2 href.
 */
const JSX_NAME = /^[A-Za-z_][\w-]*$/;

/** Braces open an expression in JSX text, so they are written as entities. */
const braces = (value: string) => value.replace(/[{}]/g, (brace) => (brace === "{" ? "&#123;" : "&#125;"));

/** Escapes backslashes, backticks and "${" so CSS survives inside a template literal. */
const templateLiteral = (value: string) => value.replace(/[\\`]/g, (char) => `\\${char}`).replace(/\$\{/g, "\\${");

function attributes(node: SvgNode): string {
  return Object.entries(node.attributes)
    .map(([name, value]) => [name === "xlink:href" ? "href" : name, value] as const)
    .filter(([name]) => JSX_NAME.test(name) && !SPECIAL.test(name))
    .map(([name, value]) => ` ${name}="${escapeAttribute(value)}"`)
    .join("");
}

/** svgson keeps text escaped, so only braces need encoding. */
const text = (node: SvgNode) => braces(node.value);

/** Scripts are dropped, and so are namespaced editor elements (sodipodi:namedview) JSX can't type. */
function visible(node: SvgNode): SvgNode[] {
  return node.children.filter(
    (child) => !(child.type === "element" && (child.name === "script" || child.name.includes(":"))),
  );
}

/** <style> keeps its CSS verbatim as a template literal child, like the React export. */
function style(node: SvgNode, pad: string): string {
  const css = node.children.map((child) => child.value).join("");
  return `${pad}<style${attributes(node)}>{\`${templateLiteral(css)}\`}</style>`;
}

function inline(node: SvgNode): string {
  if (node.type === "text") return text(node).trim();
  if (node.name === "style") return style(node, "");
  const children = visible(node).map(inline).join("");
  return children
    ? `<${node.name}${attributes(node)}>${children}</${node.name}>`
    : `<${node.name}${attributes(node)} />`;
}

function markup(node: SvgNode, depth: number, extra = "", prefix: string[] = []): string {
  const pad = "  ".repeat(depth);
  if (node.type === "text") return `${pad}${text(node).trim()}`;
  if (node.name === "style") return style(node, pad);
  const open = `${pad}<${node.name}${attributes(node)}${extra}`;
  const children = visible(node);
  if (children.length === 0 && prefix.length === 0) return `${open} />`;
  // Elements with text content stay on one line so whitespace isn't altered.
  if (children.some((child) => child.type === "text"))
    return `${open}>${children.map((child) => (child.type === "text" ? text(child) : inline(child))).join("")}</${node.name}>`;
  const lines = [...prefix.map((line) => `${pad}  ${line}`), ...children.map((child) => markup(child, depth + 1))];
  return `${open}>\n${lines.join("\n")}\n${pad}</${node.name}>`;
}

/**
 * The JSX for the <svg> root and everything inside it, written as the SVG source spells it (the
 * Solid and Qwik converters). The root is sized with 1em, `extra` goes on the root after its own
 * attributes, and `prefix` lines open its children.
 */
export function verbatimJsx(root: SvgNode, extra: string, prefix: string[], depth: number): string {
  const tree = structuredClone(root);
  for (const attribute of ["width", "height", "role", "aria-hidden"]) delete tree.attributes[attribute];
  tree.attributes = { ...tree.attributes, width: "1em", height: "1em" };
  return markup(tree, depth, extra, prefix).trimStart();
}

/**
 * SolidJS component. Solid sets SVG attributes as written, so they keep their SVG spelling (class,
 * stroke-width) apart from xlink:href, which becomes href. Extra props such as class and style are
 * spread onto the <svg>, and an optional `title` prop, split off with splitProps so it stays
 * reactive, gives the icon an accessible name.
 */
export function solidComponent(root: SvgNode, fileName: string): string {
  const name = componentNameFromFile(fileName);
  const template = verbatimJsx(
    root,
    ` role={local.title ? "img" : undefined} aria-hidden={local.title ? undefined : "true"} {...rest}`,
    ["{local.title ? <title>{local.title}</title> : null}"],
    2,
  );

  return `import { splitProps, type JSX } from "solid-js";

type ${name}Props = JSX.SvgSVGAttributes<SVGSVGElement> & {
  /** Accessible name. Without it the SVG is treated as decorative. */
  title?: string;
};

export function ${name}(props: ${name}Props) {
  const [local, rest] = splitProps(props, ["title"]);
  return (
    ${template}
  );
}
`;
}
