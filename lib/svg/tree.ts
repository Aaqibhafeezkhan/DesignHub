import { cloneNode } from "@/lib/svg/edit";
import type { SvgNode } from "@/types/svg";

/** Index path through element children, e.g. [2, 0] = first child of the third element. */
export type NodePath = number[];

const elementChildren = (node: SvgNode) => node.children.filter((child) => child.type === "element");

export function getNode(root: SvgNode, path: NodePath): SvgNode | null {
  let node: SvgNode | undefined = root;
  for (const index of path) {
    node = node ? elementChildren(node)[index] : undefined;
    if (!node) return null;
  }
  return node ?? null;
}

export type OutlineItem = { path: NodePath; name: string; id?: string; depth: number; children: number };

export function outline(root: SvgNode): OutlineItem[] {
  const items: OutlineItem[] = [];
  const visit = (node: SvgNode, path: NodePath) => {
    const children = elementChildren(node);
    items.push({ path, name: node.name, id: node.attributes.id, depth: path.length, children: children.length });
    children.forEach((child, index) => visit(child, [...path, index]));
  };
  visit(root, []);
  return items;
}

/** Immutable attribute update for the element at `path` (null removes the attribute). */
export function updateAttributes(root: SvgNode, path: NodePath, patch: Record<string, string | null>): SvgNode {
  const next = cloneNode(root);
  const target = getNode(next, path);
  if (!target) return root;
  for (const [name, value] of Object.entries(patch)) {
    if (value === null) delete target.attributes[name];
    else target.attributes[name] = value;
  }
  return next;
}

const SHAPES = new Set(["path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "text"]);

/** Applies a paint patch to every shape in the document. */
export function updateAllShapes(root: SvgNode, patch: Record<string, string | null>): SvgNode {
  const next = cloneNode(root);
  const visit = (node: SvgNode) => {
    if (SHAPES.has(node.name)) {
      for (const [name, value] of Object.entries(patch)) {
        if (value === null) delete node.attributes[name];
        else node.attributes[name] = value;
      }
    }
    node.children.forEach(visit);
  };
  visit(next);
  return next;
}

/**
 * Adds an outline copy of the selected element right after it (same parent, so the same
 * transforms apply). A scoped stylesheet forces the highlight over any inline paint.
 */
export function withHighlight(root: SvgNode, path: NodePath | null): SvgNode {
  if (!path || path.length === 0) return root;
  const next = cloneNode(root);
  const parent = getNode(next, path.slice(0, -1));
  const target = getNode(next, path);
  if (!parent || !target) return root;
  const overlay = cloneNode(target);
  overlay.attributes.class = `${overlay.attributes.class ?? ""} dh-highlight`.trim();
  delete overlay.attributes.id;
  const index = parent.children.indexOf(target);
  parent.children.splice(index + 1, 0, overlay);
  next.children.push({
    name: "style",
    type: "element",
    value: "",
    attributes: {},
    children: [
      {
        name: "",
        type: "text",
        value:
          ".dh-highlight,.dh-highlight *{fill:rgb(255 62 165/.18)!important;stroke:#ff3ea5!important;stroke-width:2px!important;vector-effect:non-scaling-stroke}",
        attributes: {},
        children: [],
      },
    ],
  });
  return next;
}
