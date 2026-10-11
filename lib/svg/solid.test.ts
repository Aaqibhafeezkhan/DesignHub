import { describe, expect, test } from "vitest";

import { parseSvg } from "@/lib/svg/parse";
import { solidComponent } from "@/lib/svg/solid";
import type { SvgNode } from "@/types/svg";

function tree(source: string): SvgNode {
  const parsed = parseSvg(source);
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.root;
}

const source = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
  <style>.a { fill: \`red\`; } \${x}</style>
  <defs><path id="p" d="M0 0h4"/></defs>
  <path class="a" stroke-width="2" stroke-linecap="round" fill-rule="evenodd" style="opacity: .5" d="M4 12h16" onclick="steal()" on:click="steal" use:tooltip="x" innerHTML="&lt;img&gt;"/>
  <use xlink:href="#p" data-note="{oops}"/>
  <text x="2" y="20" xml:space="preserve">{secret} &amp; more</text>
  <sodipodi:namedview pagecolor="#fff"/>
  <script>steal()</script>
</svg>`;

describe("SVG to SolidJS", () => {
  const code = solidComponent(tree(source), "my-icon.svg");

  test("is a Solid component named after the file with an optional title", () => {
    expect(code.startsWith('import { splitProps, type JSX } from "solid-js";\n')).toBe(true);
    expect(code).toContain("type MyIconProps = JSX.SvgSVGAttributes<SVGSVGElement> & {");
    expect(code).toContain("export function MyIcon(props: MyIconProps) {");
    expect(code).toContain('const [local, rest] = splitProps(props, ["title"]);');
    expect(code).toContain("      {local.title ? <title>{local.title}</title> : null}");
    expect(code).toMatch(/ {2}return \(\n {4}<svg [^\n]*>\n[\s\S]*\n {4}<\/svg>\n {2}\);\n\}\n$/);
  });

  test("keeps attributes in their SVG spelling and rewrites xlink:href to href", () => {
    expect(code).toContain(
      '<path class="a" stroke-width="2" stroke-linecap="round" fill-rule="evenodd" style="opacity: .5" d="M4 12h16" />',
    );
    expect(code).toContain('<use href="#p" data-note="{oops}" />');
    expect(code).not.toMatch(/strokeWidth|className|xlink/);
  });

  test("sizes the root with 1em and spreads the other props onto the svg", () => {
    expect(code).toContain(
      ' viewBox="0 0 24 24" width="1em" height="1em" role={local.title ? "img" : undefined} aria-hidden={local.title ? undefined : "true"} {...rest}>',
    );
    expect(code).not.toContain('width="24"');
  });

  test("escapes braces in text and keeps CSS in a template literal", () => {
    expect(code).toContain('<text x="2" y="20">&#123;secret&#125; &amp; more</text>');
    expect(code).toContain("<style>{`.a { fill: \\`red\\`; } \\${x}`}</style>");
  });

  test("drops scripts, event handlers, directives and innerHTML", () => {
    expect(code).not.toMatch(/onclick|on:click|use:tooltip|innerHTML|<script|steal/);
  });

  test("drops the namespaced attributes and elements Solid's JSX types don't know", () => {
    expect(code).not.toMatch(/xmlns:xlink|xml:space|sodipodi/);
    expect(code).toContain('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"');
  });
});
