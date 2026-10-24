import { describe, expect, test } from "vitest";

import { fromHex } from "@/lib/color/color";
import { tokenFormats } from "@/lib/tokens/formats";
import { deprecatedIds, deprecationOf, exportTiers, tierIds, tierOf } from "@/lib/tokens/tiers";
import type { DesignTokens } from "@/types/tokens";

const tokens: DesignTokens = {
  meta: { name: "Acme Labs", prefix: "", generatedAt: "2026-01-01", colorFormat: "hex" },
  colors: [{ name: "indigo", value: fromHex("#6366f1"), shades: [{ step: 500, value: fromHex("#6366f1") }] }],
  semantic: [{ name: "primary", ref: "indigo", value: fromHex("#6366f1") }],
  gradient: null,
  typography: null,
  effects: [],
  spacing: [{ name: "4", px: 16 }],
  radius: [{ name: "lg", px: 12 }],
};

const formats = tokenFormats(tokens);

describe("token format tiers", () => {
  test("every format has a tier", () => {
    const missing = formats.filter((format) => !format.tier).map((format) => format.id);
    expect(missing).toEqual([]);
    for (const format of formats) expect(exportTiers, format.id).toContain(format.tier);
  });

  test("every tier has formats, and the Export Engine order is unchanged by tiering", () => {
    for (const tier of exportTiers)
      expect(
        formats.some((format) => format.tier === tier),
        tier,
      ).toBe(true);
    const ids = formats.map((format) => format.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("the tier table names only real formats, so a removed format does not leave an entry behind", () => {
    const real = new Set(formats.map((format) => (format.id.startsWith("xcode-") ? "xcode" : format.id)));
    for (const id of tierIds) expect(real.has(id), id).toBe(true);
  });

  test("the core tier holds the formats most projects need", () => {
    const core = formats.filter((format) => format.tier === "core").map((format) => format.id);
    expect(core).toEqual(
      expect.arrayContaining([
        "css",
        "scss",
        "tailwind-v4",
        "tailwind-config",
        "js",
        "json",
        "style-dictionary",
        "figma-variables",
      ]),
    );
  });

  test("UI library themes are frameworks and native targets are platforms", () => {
    for (const id of ["mui", "chakra", "mantine", "shadcn", "vuetify"]) expect(tierOf(id), id).toBe("frameworks");
    for (const id of ["flutter", "swiftui", "compose", "godot", "vscode", "xcode-primary", "xcode-background"]) {
      expect(tierOf(id), id).toBe("platforms");
    }
    expect(tierOf("not-a-format")).toBeUndefined();
  });
});

describe("deprecated token formats", () => {
  test("GTK and Stylus are deprecated, with a reason, and still build", () => {
    expect(deprecatedIds.sort()).toEqual(["gtk", "stylus"]);
    for (const id of deprecatedIds) {
      const format = formats.find((item) => item.id === id);
      expect(format, id).toBeDefined();
      expect(format!.deprecated, id).toBe(deprecationOf(id));
      expect(format!.deprecated!.length, id).toBeGreaterThan(20);
      expect(format!.code.trim().length, id).toBeGreaterThan(0);
    }
  });

  test("no other format is deprecated", () => {
    expect(
      formats
        .filter((format) => format.deprecated)
        .map((format) => format.id)
        .sort(),
    ).toEqual(["gtk", "stylus"]);
  });
});
