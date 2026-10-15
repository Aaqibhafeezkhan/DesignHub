import { describe, expect, test } from "vitest";

import { litComponent } from "@/lib/svg/lit";
import { parseSvg } from "@/lib/svg/parse";
import type { SvgNode } from "@/types/svg";

function tree(source: string): SvgNode {
  const parsed = parseSvg(source);
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.root;
}

const source = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
  <style>.a { fill: \`red\`; } \${x}</style>
  <defs><path id="p" d="M0 0h4"/></defs>
  <path class="a" stroke-width="2" stroke-linecap="round" d="M4 12h16" onclick="steal()"/>
  <use xlink:href="#p" data-note="a \\ b"/>
  <text x="2" y="20">{secret} &amp; more</text>
  <sodipodi:namedview pagecolor="#fff"/>
  <script>steal()</script>
</svg>`;

describe("SVG to Lit", () => {
  const code = litComponent(tree(source), "my-icon.svg");

  test("is a LitElement named after the file with size and label properties", () => {
    expect(code.startsWith('import { LitElement, html, nothing, svg } from "lit";\n')).toBe(true);
    expect(code).toContain("export class MyIcon extends LitElement {");
    expect(code).toContain("size: { type: String },");
    expect(code).toContain("label: { type: String },");
    expect(code).toContain('this.size = "1em";');
    expect(code).toContain('customElements.define("svg-my-icon", MyIcon);');
    expect(code).toContain('"svg-my-icon": MyIcon;');
  });

  test("binds size to the root and sets the accessible name from label", () => {
    expect(code).toContain('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"');
    expect(code).toContain(' viewBox="0 0 24 24" width=${this.size} height=${this.size} role=${this.label ?');
    expect(code).toContain('aria-hidden=${this.label ? nothing : "true"}>');
    expect(code).toContain("${this.label ? svg`<title>${this.label}</title>` : nothing}");
    expect(code).not.toContain('width="24"');
  });

  test("draws the artwork in an svg template with attributes in SVG spelling", () => {
    expect(code).toContain("${svg`");
    expect(code).toContain('<path class="a" stroke-width="2" stroke-linecap="round" d="M4 12h16"/>');
    expect(code).toContain('<use xlink:href="#p" data-note="a \\\\ b"/>');
    expect(code).toContain('<text x="2" y="20">{secret} &amp; more</text>');
  });

  test("escapes backticks, backslashes and ${ so the artwork stays a string", () => {
    expect(code).toContain("<style>.a { fill: \\`red\\`; } \\${x}</style>");
    expect(code).not.toMatch(/[^\\]`red/);
  });

  test("drops scripts, event handlers and namespaced editor elements", () => {
    expect(code).not.toMatch(/onclick|<script|steal|sodipodi/);
  });
});
