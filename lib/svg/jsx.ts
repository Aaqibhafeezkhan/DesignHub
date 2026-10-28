import type { SvgNode } from "@/types/svg";

const SPECIAL: Record<string, string> = {
  class: "className",
  for: "htmlFor",
  "xlink:href": "xlinkHref",
  "xlink:title": "xlinkTitle",
  "xml:space": "xmlSpace",
  "xml:lang": "xmlLang",
  "xmlns:xlink": "xmlnsXlink",
};

function jsxAttributeName(name: string): string {
  if (SPECIAL[name]) return SPECIAL[name];
  if (name.startsWith("data-") || name.startsWith("aria-")) return name;
  return name.replace(/[:-]([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

/** "fill-rule: evenodd; opacity:.5" → `{{ fillRule: "evenodd", opacity: ".5" }}` */
function styleObject(style: string): string {
  const entries = style
    .split(";")
    .map((rule) => rule.split(":"))
    .filter(([key, ...value]) => key?.trim() && value.join(":").trim())
    .map(([key = "", ...value]) => {
      const property = key.trim().replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
      return `${property}: ${JSON.stringify(value.join(":").trim())}`;
    });
  return `{{ ${entries.join(", ")} }}`;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&");
}

function attributeString(name: string, value: string): string {
  if (name === "style") return ` style=${styleObject(value)}`;
  return ` ${jsxAttributeName(name)}=${JSON.stringify(value)}`;
}

export type JsxOptions = {
  /** Extra JSX appended to the root element's attributes (e.g. "{...props}"). */
  rootSpread?: string;
  /** Elements inserted as the root's first children (e.g. a <title>). */
  rootPrefix?: string;
  indent?: string;
  /** Elements whose children must be passed as a keyed array (react-native-svg gradients). */
  arrayChildren?: Set<string>;
};

export function toJsx(node: SvgNode, options: JsxOptions = {}, depth = 0): string {
  const indent = options.indent ?? "  ";
  const pad = indent.repeat(depth);
  if (node.type === "text") {
    const text = decodeEntities(node.value).trim();
    return text ? `${pad}{${JSON.stringify(text)}}` : "";
  }
  const isRoot = depth === 0;
  const attrs = Object.entries(node.attributes)
    .map(([name, value]) => attributeString(name, value))
    .join("");
  const spread = isRoot && options.rootSpread ? ` ${options.rootSpread}` : "";

  // <style> keeps its CSS verbatim inside a template literal.
  if (node.name === "style") {
    const css = node.children
      .map((child) => child.value)
      .join("")
      .replace(/`/g, "\\`")
      .replace(/\$\{/g, "\\${");
    return `${pad}<style${attrs}>{\`${css}\`}</style>`;
  }

  if (options.arrayChildren?.has(node.name)) {
    const items = node.children
      .filter((child) => child.type === "element")
      .map((child, index) => {
        const keyed = { ...child, attributes: { key: String(index), ...child.attributes } };
        return `${toJsx(keyed, options, depth + 2)},`;
      });
    return `${pad}<${node.name}${attrs}>\n${pad}${indent}{[\n${items.join("\n")}\n${pad}${indent}]}\n${pad}</${node.name}>`;
  }

  const children = node.children.map((child) => toJsx(child, options, depth + 1)).filter(Boolean);
  if (isRoot && options.rootPrefix) children.unshift(`${indent}${options.rootPrefix}`);
  if (children.length === 0) return `${pad}<${node.name}${attrs}${spread} />`;
  return `${pad}<${node.name}${attrs}${spread}>\n${children.join("\n")}\n${pad}</${node.name}>`;
}

/** "my-icon.svg" → "MyIcon" (always a valid identifier). */
export function componentNameFromFile(fileName: string): string {
  const base = fileName.replace(/\.svg$/i, "");
  const pascal = base
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  const name = pascal || "Svg";
  return /^[0-9]/.test(name) ? `Svg${name}` : name;
}

/** Replaces solid fill/stroke colors with currentColor so the icon follows text color. */
export function withCurrentColor(root: SvgNode): SvgNode {
  const next = structuredClone(root);
  const visit = (node: SvgNode) => {
    for (const name of ["fill", "stroke"]) {
      const value = node.attributes[name];
      if (value && value !== "none" && !value.startsWith("url(") && value !== "currentColor")
        node.attributes[name] = "currentColor";
    }
    node.children.forEach(visit);
  };
  visit(next);
  return next;
}

export function reactComponent(root: SvgNode, fileName: string): string {
  const name = componentNameFromFile(fileName);
  const tree = structuredClone(root);
  delete tree.attributes.width;
  delete tree.attributes.height;
  tree.attributes.width = "1em";
  tree.attributes.height = "1em";
  const markup = toJsx(tree, {
    rootSpread: 'role={title ? "img" : undefined} aria-hidden={title ? undefined : true} {...props}',
    rootPrefix: "{title ? <title>{title}</title> : null}",
    indent: "  ",
  })
    .split("\n")
    .map((line) => `    ${line}`)
    .join("\n")
    .trimStart();

  return `import type { SVGProps } from "react";

type ${name}Props = SVGProps<SVGSVGElement> & {
  /** Accessible name. Without it the SVG is treated as decorative. */
  title?: string;
};

export function ${name}({ title, ...props }: ${name}Props) {
  return (
    ${markup}
  );
}
`;
}
