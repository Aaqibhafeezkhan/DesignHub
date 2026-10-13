import { describe, expect, test } from "vitest";

import { componentName, iconExports } from "@/lib/icons/export";
import { defaultIconStyle } from "@/lib/icons/svg";

const icon = {
  body: '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M4 12h16"/>',
  width: 24,
  height: 24,
};

describe("icon exports", () => {
  test("Vue component keeps SVG attributes and passes $attrs to the svg", () => {
    const vue = iconExports("tabler:brand-github", icon, defaultIconStyle).find((format) => format.id === "vue");
    expect(vue?.filename).toBe(`${componentName("tabler:brand-github")}.vue`);
    expect(vue?.code).toContain('defineOptions({ name: "BrandGithubIcon", inheritAttrs: false });');
    expect(vue?.code).toContain('<script setup lang="ts">');
    expect(vue?.code).toMatch(/<template>\n {2}<svg [^>]*v-bind="\$attrs">/);
    expect(vue?.code).toContain('stroke-width="2"');
    expect(vue?.code).not.toContain("strokeWidth");
  });

  test("Svelte component spreads rest props onto the svg and keeps SVG attributes", () => {
    const svelte = iconExports("tabler:brand-github", icon, defaultIconStyle).find((format) => format.id === "svelte");
    expect(svelte?.filename).toBe("BrandGithubIcon.svelte");
    expect(svelte?.language).toBe("svelte");
    expect(svelte?.code).toContain('<script lang="ts">');
    expect(svelte?.code).toContain("let { ...rest }: SVGAttributes<SVGSVGElement> = $props();");
    expect(svelte?.code).toMatch(/\n<svg [^>]*width="1em" height="1em"[^>]*\{\.\.\.rest\}>\n/);
    expect(svelte?.code).toContain('stroke-width="2"');
    expect(svelte?.code).not.toContain("strokeWidth");
  });

  test("Svelte component escapes braces so they aren't read as expressions", () => {
    const styled = { ...icon, body: "<style>.a{fill:red}</style><path class='a' d='M0 0h24'/>" };
    const svelte = iconExports("tabler:brand-github", styled, defaultIconStyle).find(
      (format) => format.id === "svelte",
    );
    expect(svelte?.code).toContain(".a&#123;fill:red&#125;");
  });

  test("Angular standalone component binds size and color inputs on the svg", () => {
    const angular = iconExports("tabler:brand-github", icon, { ...defaultIconStyle, color: "#ef4444" }).find(
      (format) => format.id === "angular",
    );
    expect(angular?.filename).toBe("brand-github-icon.component.ts");
    expect(angular?.language).toBe("ts");
    expect(angular?.code).toContain('selector: "brand-github-icon",');
    expect(angular?.code).toContain("standalone: true,");
    expect(angular?.code).toMatch(
      /<svg [^>]*\[attr\.width\]="size" \[attr\.height\]="size"[^>]*\[style\.color\]="color">/,
    );
    expect(angular?.code).toContain("export class BrandGithubIconComponent {");
    expect(angular?.code).toContain('@Input() size: string | number = "1em";');
    expect(angular?.code).toContain('@Input() color = "#ef4444";');
    // The body keeps currentColor so the color input can recolor it.
    expect(angular?.code).toContain('stroke="currentColor"');
    expect(angular?.code).toContain('stroke-width="2"');
  });

  test("Angular component escapes template syntax and template literal characters", () => {
    const tricky = { ...icon, body: "<style>@media print{.a{fill:red}}</style><text>`${x}` \\ {{ y }}</text>" };
    const angular = iconExports("tabler:brand-github", tricky, defaultIconStyle).find(
      (format) => format.id === "angular",
    );
    expect(angular?.code).toContain("<g ngNonBindable>");
    // <style> is raw text in Angular templates, so its CSS is left as written.
    expect(angular?.code).toContain("<style>@media print{.a{fill:red}}</style>");
    expect(angular?.code).toContain("<text>\\`\\$&#123;x&#125;\\` \\\\ &#123;&#123; y &#125;&#125;</text>");
  });

  test("Solid component spreads props onto the svg and keeps SVG attributes", () => {
    const solid = iconExports("tabler:brand-github", icon, defaultIconStyle).find((format) => format.id === "solid");
    expect(solid?.label).toBe("Solid");
    expect(solid?.filename).toBe("BrandGithubIcon.tsx");
    expect(solid?.language).toBe("tsx");
    expect(solid?.code).toContain('import type { JSX } from "solid-js";');
    expect(solid?.code).toContain("export function BrandGithubIcon(props: JSX.SvgSVGAttributes<SVGSVGElement>) {");
    expect(solid?.code).toMatch(/<svg [^>]*width="1em" height="1em"[^>]*\{\.\.\.props\}>/);
    expect(solid?.code).toContain('stroke-width="2"');
    expect(solid?.code).not.toContain("strokeWidth");
    expect(solid?.code).not.toContain("className");
  });

  test("Solid component escapes braces so JSX doesn't read them as expressions", () => {
    const styled = { ...icon, body: "<style>.a{fill:red}</style><path class='a' d='M0 0h24'/><use xlink:href='#p'/>" };
    const solid = iconExports("tabler:brand-github", styled, defaultIconStyle).find((format) => format.id === "solid");
    expect(solid?.code).toContain(".a&#123;fill:red&#125;");
    expect(solid?.code).toContain("class='a'");
    expect(solid?.code).toContain("<use href='#p'/>");
  });

  test("Qwik component uses component$ and spreads props onto the svg", () => {
    const qwik = iconExports("tabler:brand-github", icon, defaultIconStyle).find((format) => format.id === "qwik");
    expect(qwik?.label).toBe("Qwik");
    expect(qwik?.filename).toBe("BrandGithubIcon.tsx");
    expect(qwik?.language).toBe("tsx");
    expect(qwik?.code).toContain('import { component$, type PropsOf } from "@builder.io/qwik";');
    expect(qwik?.code).toContain('export const BrandGithubIcon = component$((props: PropsOf<"svg">) => {');
    expect(qwik?.code).toMatch(/<svg [^>]*width="1em" height="1em"[^>]*\{\.\.\.props\}>/);
    expect(qwik?.code).toContain('stroke-width="2"');
    expect(qwik?.code).not.toContain("className");
    expect(qwik?.code.trimEnd().endsWith("});")).toBe(true);
  });

  test("Lit component defines size and color properties and renders the body with svg", () => {
    const lit = iconExports("tabler:brand-github", icon, { ...defaultIconStyle, color: "#ef4444" }).find(
      (format) => format.id === "lit",
    );
    expect(lit?.label).toBe("Lit");
    expect(lit?.filename).toBe("brand-github-icon.ts");
    expect(lit?.language).toBe("ts");
    expect(lit?.code).toContain('import { LitElement, html, svg } from "lit";');
    expect(lit?.code).toContain("export class BrandGithubIcon extends LitElement {");
    expect(lit?.code).toContain("size: { type: String },");
    expect(lit?.code).toContain('this.size = "1em";');
    expect(lit?.code).toContain('this.color = "#ef4444";');
    expect(lit?.code).toContain('customElements.define("brand-github-icon", BrandGithubIcon);');
    expect(lit?.code).toMatch(/width=\$\{this\.size\} height=\$\{this\.size\}/);
    expect(lit?.code).toContain('style="color: ${this.color}"');
    expect(lit?.code).toContain("${svg`");
    // The body keeps currentColor so the color property can recolor it.
    expect(lit?.code).toContain('stroke="currentColor"');
    expect(lit?.code).toContain('stroke-width="2"');
  });

  test("Lit component escapes backticks, backslashes and ${ in the artwork", () => {
    const tricky = { ...icon, body: "<text>`${x}` \\ done</text><path d='M0 0h24'/>" };
    const lit = iconExports("tabler:brand-github", tricky, defaultIconStyle).find((format) => format.id === "lit");
    expect(lit?.code).toContain("<text>\\`\\${x}\\` \\\\ done</text>");
    expect(lit?.code).not.toMatch(/[^\\]`\$\{x\}/);
  });

  test("Qwik component escapes braces and rewrites xlink:href", () => {
    const styled = { ...icon, body: "<style>.a{fill:red}</style><path class='a' d='M0 0h24'/><use xlink:href='#p'/>" };
    const qwik = iconExports("tabler:brand-github", styled, defaultIconStyle).find((format) => format.id === "qwik");
    expect(qwik?.code).toContain(".a&#123;fill:red&#125;");
    expect(qwik?.code).toContain("<use href='#p'/>");
    expect(qwik?.code).not.toContain("xlink:");
  });
});
