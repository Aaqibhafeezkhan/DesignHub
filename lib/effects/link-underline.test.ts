import { describe, expect, test } from "vitest";

import { effectsBundle } from "@/lib/effects/bundle";
import { effectStylesheet, reactStyle, scssMixin, tailwindClasses, tailwindUtility } from "@/lib/effects/css";
import { effectDefaults } from "@/lib/effects/defaults";
import { LINK_UNDERLINE_MIN_CONTRAST, linkUnderlineContrast } from "@/lib/effects/link-underline";
import { generateEffect } from "@/lib/effects/registry";
import type { EffectCss, LinkUnderlineSettings } from "@/types/effects";

const defaults = effectDefaults["link-underline"];
const generate = (patch: Partial<LinkUnderlineSettings> = {}): EffectCss =>
  generateEffect("link-underline", { ...defaults, ...patch })!;

const value = (effect: EffectCss, property: string) =>
  effect.declarations.find((declaration) => declaration.property === property)?.value;

describe("link underline", () => {
  test("sets thickness, offset and color with text-decoration and a zero-width background bar", () => {
    const effect = generate({ color: "#4338ca", thickness: 3, offset: 6 });
    expect(value(effect, "color")).toBe("#4338ca");
    expect(value(effect, "text-decoration-line")).toBe("underline");
    expect(value(effect, "text-decoration-color")).toBe("#4338ca");
    expect(value(effect, "text-decoration-thickness")).toBe("3px");
    expect(value(effect, "text-underline-offset")).toBe("6px");
    expect(value(effect, "background-image")).toBe("linear-gradient(#4338ca, #4338ca)");
    expect(value(effect, "background-repeat")).toBe("no-repeat");
    expect(value(effect, "background-position")).toBe("0 calc(100% - 6px)");
    expect(value(effect, "background-size")).toBe("0% 3px");
    expect(value(effect, "transition")).toBe("background-size 200ms ease");
  });

  test("grows the underline on hover and removes that transition under reduced motion", () => {
    const css = effectStylesheet(generate({ thickness: 3 }), ".link");
    const hoverAt = css.indexOf(".link:hover {");
    const motionAt = css.indexOf("@media (prefers-reduced-motion: reduce)");
    expect(hoverAt).toBeGreaterThanOrEqual(0);
    expect(motionAt).toBeGreaterThan(hoverAt);
    const hover = css.slice(hoverAt, css.indexOf("}", hoverAt));
    expect(hover).toContain("background-size: 100% 3px;");
    expect(hover).toContain("text-decoration-color: transparent;");
    const media = css.slice(motionAt);
    expect(media).toContain(".link,");
    expect(media).toContain(".link:hover");
    expect(media).toContain("transition: none;");
    expect(media).not.toContain("background-size 200ms");
  });

  test("exports every Effects Lab format and a rule in effects.css", () => {
    const effect = generate();
    const css = effectStylesheet(effect, ".fx-link-underline");
    expect(css).toContain(".fx-link-underline {");
    expect(css).toContain("text-decoration-thickness:");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(tailwindClasses(effect.declarations)).toContain("[text-decoration-thickness:2px]");
    expect(tailwindUtility("fx-link-underline", effect)).toContain("@utility fx-link-underline");
    expect(tailwindUtility("fx-link-underline", effect)).toContain("&:hover");
    expect(scssMixin("fx-link-underline", effect)).toContain("@mixin fx-link-underline");
    expect(reactStyle("link-underline", effect)).toContain('textDecorationThickness: "2px"');
    expect(effectsBundle(effectDefaults)).toContain("/* Link underline */\n.fx-link-underline {");
  });

  test("checks the link color against the page for 4.5:1", () => {
    expect(linkUnderlineContrast(defaults)).toBeGreaterThanOrEqual(LINK_UNDERLINE_MIN_CONTRAST);
    expect(linkUnderlineContrast({ ...defaults, color: "#ffffff" })).toBeLessThan(LINK_UNDERLINE_MIN_CONTRAST);
    expect(linkUnderlineContrast({ ...defaults, color: "nope" })).toBe(1);
  });
});
