import { describe, expect, test } from "vitest";

import { frameworkFormat, frameworkIds } from "@/lib/svg/converters";
import { svgFormats } from "@/lib/svg/formats";
import { iconExports } from "@/lib/icons/export";
import { defaultIconStyle } from "@/lib/icons/svg";
import { parseSvg } from "@/lib/svg/parse";
import { defaultOptimizeOptions, optimizeSvg, optimizeTree } from "@/lib/svg/optimize";
import { reactNativeComponent } from "@/lib/svg/react-native";
import { sampleSvg } from "@/lib/svg/sample";

describe("framework converters", () => {
  test("each framework appears once", () => {
    expect(new Set(frameworkIds).size).toBe(frameworkIds.length);
  });

  test("a format takes its label, language and file name from the one list", () => {
    expect(frameworkFormat("vue", "BadgeIcon", "x")).toMatchObject({
      label: "Vue",
      filename: "BadgeIcon.vue",
      language: "vue",
    });
    expect(frameworkFormat("angular", "BadgeIcon", "x").filename).toBe("badge-icon.component.ts");
    expect(frameworkFormat("native", "BadgeIcon", "x").filename).toBe("BadgeIcon.native.tsx");
  });

  test("the SVG Playground and Icon Studio agree on every framework's label, language and file name", () => {
    const parsed = parseSvg(sampleSvg);
    if (!parsed.ok) throw new Error("sample must parse");
    const tree = optimizeTree(parsed.root, defaultOptimizeOptions);
    const playground = svgFormats({
      root: parsed.root,
      optimized: optimizeSvg(parsed.root, sampleSvg, defaultOptimizeOptions),
      tree,
      native: reactNativeComponent(tree, "badge.svg"),
      currentColor: false,
      name: "badge.svg",
      sprite: [],
    });
    const icon = iconExports(
      "tabler:badge",
      { body: '<path d="M0 0h24v24H0z"/>', width: 24, height: 24 },
      defaultIconStyle,
    );
    for (const id of frameworkIds) {
      const a = playground.find((format) => format.id === id);
      const b = icon.find((format) => format.id === id);
      expect(a, `playground ${id}`).toBeDefined();
      expect(b, `icon ${id}`).toBeDefined();
      expect([a!.label, a!.language]).toEqual([b!.label, b!.language]);
    }
  });

  test("no framework format is written twice in either studio", () => {
    const icon = iconExports("tabler:badge", { body: "<path/>", width: 24, height: 24 }, defaultIconStyle);
    const ids = icon.map((format) => format.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
