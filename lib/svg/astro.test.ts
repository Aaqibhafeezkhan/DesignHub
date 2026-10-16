import { describe, expect, test } from "vitest";

import { astroComponent } from "@/lib/svg/astro";
import { parseSvg } from "@/lib/svg/parse";
import type { SvgNode } from "@/types/svg";

function tree(source: string): SvgNode {
  const parsed = parseSvg(source);
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.root;
}

const small = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
  <defs><path id="p" d="M0 0h4"/></defs>
  <path stroke-width="2" stroke-linecap="round" fill-rule="evenodd" d="M4 12h16" onclick="steal()"/>
  <use xlink:href="#p" data-note="{keep}" set:html="x" client:load/>
  <text x="2" y="20">{secret} &amp; more</text>
  <sodipodi:namedview pagecolor="#fff"/>
  <script>steal()</script>
</svg>`;

const styled = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <style>.a { fill: red; } @media (min-width: 1px) { .a { fill: blue; } }</style>
  <path class="a" d="M0 0h24v24H0z"/>
</svg>`;

describe("SVG to Astro", () => {
  const code = astroComponent(tree(small));

  test("has a frontmatter block with a typed size prop and an optional title", () => {
    expect(code.startsWith('---\nimport type { HTMLAttributes } from "astro/types";\n')).toBe(true);
    expect(code).toContain('interface Props extends HTMLAttributes<"svg"> {');
    expect(code).toContain("  size?: string | number;");
    expect(code).toContain('const { size = "1em", title, ...rest } = Astro.props;\n---\n');
  });

  test("sizes the root from the size prop, names it from title and spreads the rest", () => {
    expect(code).toContain(
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24" width={size} height={size} role={title ? "img" : undefined} aria-hidden={title ? undefined : "true"} {...rest}>',
    );
    expect(code).toContain("  {title && <title>{title}</title>}\n");
    expect(code).not.toContain('width="24"');
  });

  test("keeps attributes in their SVG spelling", () => {
    expect(code).toContain('<path stroke-width="2" stroke-linecap="round" fill-rule="evenodd" d="M4 12h16" />');
    expect(code).toContain('<use xlink:href="#p" data-note="{keep}" />');
    expect(code).not.toMatch(/strokeWidth|className/);
  });

  test("writes braces in text as entities", () => {
    expect(code).toContain('<text x="2" y="20">&#123;secret&#125; &amp; more</text>');
  });

  test("drops scripts, event handlers, Astro directives and namespaced editor elements", () => {
    expect(code).not.toMatch(/onclick|<script|steal|sodipodi|set:html|client:load/);
  });

  test("keeps a <style> block as written, with is:inline so Astro leaves it unscoped", () => {
    const output = astroComponent(tree(styled));
    expect(output).toContain(
      "<style is:inline>.a { fill: red; } @media (min-width: 1px) { .a { fill: blue; } }</style>",
    );
    expect(output).toContain('<path class="a" d="M0 0h24v24H0z" />');
    expect(output).not.toContain("&#123;");
  });

  test("an empty svg has no body", () => {
    const output = astroComponent(tree('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>'));
    expect(output).toContain("  {title && <title>{title}</title>}\n</svg>\n");
  });
});
