import { escapeTemplateLiteral, kebabCase } from "@/lib/svg/angular";
import { componentNameFromFile } from "@/lib/svg/jsx";
import { escapeAttribute } from "@/lib/svg/serialize";
import type { SvgNode } from "@/types/svg";

/**
 * Inline event handlers (onclick and friends) would run as written in a static template, so they
 * are dropped. Names are also limited to plain XML names, which keeps Lit's binding prefixes
 * (".prop", "?bool", "@event") out of the markup.
 */
const UNSAFE = /^on/i;
const XML_NAME = /^[A-Za-z_][\w:.-]*$/;

function attributes(node: SvgNode): string {
  return Object.entries(node.attributes)
    .filter(([name]) => XML_NAME.test(name) && !UNSAFE.test(name))
    .map(([name, value]) => ` ${name}="${escapeAttribute(value)}"`)
    .join("");
}

/** svgson keeps text escaped, so it is written back as it is. */
const text = (node: SvgNode) => node.value;

/** Scripts are dropped, and so are namespaced editor elements (sodipodi:namedview). */
function visible(node: SvgNode): SvgNode[] {
  return node.children.filter(
    (child) => !(child.type === "element" && (child.name === "script" || child.name.includes(":"))),
  );
}

function inline(node: SvgNode): string {
  if (node.type === "text") return text(node).trim();
  const children = visible(node).map(inline).join("");
  return children
    ? `<${node.name}${attributes(node)}>${children}</${node.name}>`
    : `<${node.name}${attributes(node)}/>`;
}

function markup(node: SvgNode, depth: number): string {
  const pad = "  ".repeat(depth);
  if (node.type === "text") return `${pad}${text(node).trim()}`;
  const open = `${pad}<${node.name}${attributes(node)}`;
  const children = visible(node);
  if (children.length === 0) return `${open}/>`;
  // Elements with text content stay on one line so whitespace isn't altered.
  if (children.some((child) => child.type === "text"))
    return `${open}>${children.map((child) => (child.type === "text" ? text(child) : inline(child))).join("")}</${node.name}>`;
  return `${open}>\n${children.map((child) => markup(child, depth + 1)).join("\n")}\n${pad}</${node.name}>`;
}

/**
 * Lit web component with `size` and `label` properties, the same shape as the Lit icon export. The
 * <svg> root is an `html` template and its artwork an `svg` template inside it, so Lit parses the
 * artwork in the SVG namespace. Properties are declared with `static properties` (no decorators).
 * The label is the accessible name (`title` is already an HTMLElement property): without it the
 * SVG is treated as decorative. Backslashes, backticks and $ are escaped because the artwork sits in
 * a template literal, and scripts and inline event handlers are dropped.
 */
export function litComponent(root: SvgNode, fileName: string): string {
  const name = componentNameFromFile(fileName);
  const tag = `svg-${kebabCase(name)}`;
  const tree = structuredClone(root);
  for (const attribute of ["width", "height", "role", "aria-hidden", "aria-label"]) delete tree.attributes[attribute];
  const body = escapeTemplateLiteral(
    visible(tree)
      .map((child) => markup(child, 4))
      .join("\n"),
  );
  const open = escapeTemplateLiteral(`<svg${attributes(tree)}`);
  const artwork = body ? `\${svg\`\n${body}\n      \`}` : "";

  return `import { LitElement, html, nothing, svg } from "lit";

export class ${name} extends LitElement {
  static properties = {
    size: { type: String },
    label: { type: String },
  };

  declare size: string;
  declare label: string | undefined;

  constructor() {
    super();
    /** Width and height. The default follows the surrounding font size. */
    this.size = "1em";
  }

  render() {
    return html\`
      ${open} width=\${this.size} height=\${this.size} role=\${this.label ? "img" : nothing} aria-label=\${this.label ?? nothing} aria-hidden=\${this.label ? nothing : "true"}>
        \${this.label ? svg\`<title>\${this.label}</title>\` : nothing}${artwork}
      </svg>
    \`;
  }
}

customElements.define("${tag}", ${name});

declare global {
  interface HTMLElementTagNameMap {
    "${tag}": ${name};
  }
}
`;
}
