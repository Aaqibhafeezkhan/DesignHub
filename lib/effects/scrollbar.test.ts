import { describe, expect, test } from "vitest";

import { effectStylesheet, tailwindClasses } from "@/lib/effects/css";
import { effectDefaults } from "@/lib/effects/defaults";
import { effectsBundle } from "@/lib/effects/bundle";
import { generateEffect } from "@/lib/effects/registry";
import { SCROLLBAR_MIN_CONTRAST, scrollbarContrast } from "@/lib/effects/scrollbar";
import type { ScrollbarSettings } from "@/types/effects";

const defaults = effectDefaults.scrollbar;
const bar = (patch: Partial<ScrollbarSettings> = {}): ScrollbarSettings => ({ ...defaults, ...patch });

describe("scrollbar", () => {
  test("writes the standard properties and a WebKit fallback with a hover color", () => {
    const effect = generateEffect("scrollbar", bar({ thumb: "#6366f1", track: "#e4e4e7", thumbHover: "#4338ca" }))!;
    const css = effectStylesheet(effect, ".fx-scrollbar");
    expect(css).toContain("scrollbar-color: #6366f1 #e4e4e7;");
    expect(css).toContain("@supports not (scrollbar-color: auto)");
    expect(css).toContain(".fx-scrollbar::-webkit-scrollbar-thumb:hover {\n    background: #4338ca;");
  });

  test("uses thin scrollbars up to 10px and auto above", () => {
    const width = (value: number) =>
      generateEffect("scrollbar", bar({ width: value }))!.declarations.find(
        (declaration) => declaration.property === "scrollbar-width",
      )?.value;
    expect(width(10)).toBe("thin");
    expect(width(11)).toBe("auto");
  });

  test("exports the standard properties as Tailwind classes", () => {
    const effect = generateEffect("scrollbar", bar())!;
    expect(tailwindClasses(effect.declarations)).toContain("[scrollbar-color:#6366f1_#e4e4e7]");
  });

  test("is part of the effects.css bundle", () => {
    expect(effectsBundle(effectDefaults)).toContain("/* Scrollbar */\n.fx-scrollbar {");
  });

  test("checks the thumb against the track for 3:1", () => {
    expect(scrollbarContrast(bar())).toBeGreaterThanOrEqual(SCROLLBAR_MIN_CONTRAST);
    expect(scrollbarContrast(bar({ thumb: "#d4d4d8", track: "#e4e4e7" }))).toBeLessThan(SCROLLBAR_MIN_CONTRAST);
    expect(scrollbarContrast(bar({ thumb: "nope" }))).toBe(1);
  });
});
