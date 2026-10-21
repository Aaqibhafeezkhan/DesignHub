import { describe, expect, test } from "vitest";

import { effectsBundle } from "@/lib/effects/bundle";
import { effectStylesheet, tailwindClasses } from "@/lib/effects/css";
import { effectDefaults } from "@/lib/effects/defaults";
import { generateEffect } from "@/lib/effects/registry";
import type { ScrollShadowSettings } from "@/types/effects";

const defaults = effectDefaults["scroll-shadow"];
const make = (patch: Partial<ScrollShadowSettings> = {}) => generateEffect("scroll-shadow", { ...defaults, ...patch })!;
const value = (property: string, patch: Partial<ScrollShadowSettings> = {}) =>
  make(patch).declarations.find((declaration) => declaration.property === property)?.value ?? "";

describe("scroll shadow", () => {
  test("pairs two scrolling covers with two fixed shadows, all four layers aligned", () => {
    // Splits a comma list at the top level only, so commas inside gradients stay put.
    const layers = (property: string) => {
      const parts: string[] = [];
      let depth = 0;
      let current = "";
      for (const char of value(property)) {
        if (char === "(") depth += 1;
        if (char === ")") depth -= 1;
        if (char === "," && depth === 0) {
          parts.push(current.trim());
          current = "";
        } else current += char;
      }
      return [...parts, current.trim()];
    };
    expect(layers("background-image")).toHaveLength(4);
    expect(layers("background-position")).toHaveLength(4);
    expect(layers("background-size")).toHaveLength(4);
    expect(value("background-attachment")).toBe("local, local, scroll, scroll");
  });

  test("covers use the box background and the shadow height sets the sizes", () => {
    expect(value("background-color", { surface: "#101010" })).toBe("#101010");
    expect(value("background-image", { surface: "#101010" })).toContain("rgb(16 16 16 / 1) 30%");
    expect(value("background-size", { size: 10 })).toBe("100% 30px, 100% 30px, 100% 10px, 100% 10px");
  });

  test("the shadow color and strength reach the radial gradients", () => {
    expect(value("background-image", { color: "#ff0000", opacity: 0.5 })).toContain("rgb(255 0 0 / 0.5)");
  });

  test("needs no JavaScript: exports plain CSS, Tailwind classes and the bundle", () => {
    const effect = make();
    expect(effectStylesheet(effect, ".fx-scroll-shadow")).toContain("overflow-y: auto;");
    expect(tailwindClasses(effect.declarations)).toContain("[background-attachment:local,local,scroll,scroll]");
    expect(effectsBundle(effectDefaults)).toContain("/* Scroll shadow */\n.fx-scroll-shadow {");
  });
});
