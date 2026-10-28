import type { INode } from "svgson";

export type SvgNode = INode;

export type SvgParseResult = { ok: true; root: SvgNode } | { ok: false; error: string };
