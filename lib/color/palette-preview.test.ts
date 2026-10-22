import { describe, expect, test } from "vitest";

import { contrastRatio, fromHex, readableTextColor, toHex } from "@/lib/color/color";
import { PREVIEW_ROLE_MAP, palettePreviewTheme, palettePreviewThemes } from "@/lib/color/palette-preview";
import { roleColor } from "@/lib/tokens/native";
import type { DesignTokens } from "@/types/tokens";

const shade = (step: number, hex: string) => ({ step, value: fromHex(hex) });

const tokens: DesignTokens = {
  meta: { name: "Acme Labs", prefix: "", generatedAt: "2026-01-01", colorFormat: "hex" },
  colors: [
    {
      name: "indigo",
      value: fromHex("#6366f1"),
      shades: [shade(200, "#c7d2fe"), shade(300, "#a5b4fc")],
    },
    { name: "slate", value: fromHex("#0f172a"), shades: [] },
    {
      name: "amber",
      value: fromHex("#f59e0b"),
      shades: [shade(200, "#fde68a"), shade(300, "#fcd34d")],
    },
  ],
  semantic: [
    { name: "primary", ref: "indigo", value: fromHex("#6366f1") },
    { name: "accent", ref: "amber", value: fromHex("#f59e0b") },
    { name: "foreground", ref: "slate", value: fromHex("#0f172a") },
    { name: "background", ref: "white", value: fromHex("#ffffff") },
  ],
  gradient: null,
  typography: null,
  effects: [],
  spacing: [],
  radius: [],
};

describe("palette preview role-to-surface mapping", () => {
  test("every preview piece resolves through roleColor (with the documented fallbacks)", () => {
    const light = palettePreviewTheme(tokens, false)!;
    const byId = Object.fromEntries(light.surfaces.map((surface) => [surface.id, surface]));

    expect(light.pageRole).toBe("background");
    expect(toHex(light.page)).toBe(toHex(roleColor(tokens, "background", false)!.value));

    expect(byId.card?.surfaceRole).toBe(PREVIEW_ROLE_MAP.card.surfaceFallback);
    expect(toHex(byId.card!.background)).toBe(toHex(roleColor(tokens, "background", false)!.value));
    expect(byId.card?.textRole).toBe("foreground");
    expect(toHex(byId.card!.foreground)).toBe(toHex(roleColor(tokens, "foreground", false)!.value));

    expect(byId.button?.surfaceRole).toBe("primary");
    expect(toHex(byId.button!.background)).toBe(toHex(roleColor(tokens, "primary", false)!.value));
    expect(byId.button?.textRole).toBe("readable");
    expect(toHex(byId.button!.foreground)).toBe(toHex(readableTextColor(byId.button!.background)));

    expect(byId.link?.surfaceRole).toBe("background");
    expect(byId.link?.textRole).toBe("primary");
    expect(toHex(byId.link!.foreground)).toBe(toHex(roleColor(tokens, "primary", false)!.value));

    expect(byId.input?.surfaceRole).toBe("background");
    expect(byId.input?.textRole).toBe("foreground");
    expect(byId.input?.borderRole).toBe("accent");
    expect(toHex(byId.input!.border!)).toBe(toHex(roleColor(tokens, "accent", false)!.value));
  });

  test("dark mode uses the same role map through roleColor(dark)", () => {
    const dark = palettePreviewTheme(tokens, true)!;
    const button = dark.surfaces.find((surface) => surface.id === "button")!;
    const page = roleColor(tokens, "background", true)!;
    const primary = roleColor(tokens, "primary", true)!;

    expect(dark.dark).toBe(true);
    expect(toHex(dark.page)).toBe(toHex(page.value));
    expect(toHex(button.background)).toBe(toHex(primary.value));
    // Primary lifts to indigo 300 in dark mode.
    expect(primary.step).toBe(300);
    expect(toHex(button.background)).toBe("#a5b4fc");
  });

  test("prefers an explicit card role over the background fallback", () => {
    const withCard: DesignTokens = {
      ...tokens,
      semantic: [...tokens.semantic, { name: "card", ref: "indigo", value: fromHex("#eef2ff") }],
    };
    const light = palettePreviewTheme(withCard, false)!;
    const card = light.surfaces.find((surface) => surface.id === "card")!;
    expect(card.surfaceRole).toBe("card");
    expect(toHex(card.background)).toBe(toHex(roleColor(withCard, "card", false)!.value));
  });

  test("reports the WCAG contrast of text on each surface", () => {
    const light = palettePreviewTheme(tokens, false)!;
    for (const surface of light.surfaces) {
      expect(surface.contrast).toBeCloseTo(contrastRatio(surface.foreground, surface.background), 5);
    }
  });

  test("returns both themes, and nothing when roles are missing", () => {
    const themes = palettePreviewThemes(tokens);
    expect(themes.map((theme) => theme.dark)).toEqual([false, true]);
    expect(palettePreviewTheme({ ...tokens, semantic: [] }, false)).toBeUndefined();
    expect(palettePreviewThemes({ ...tokens, semantic: [] })).toEqual([]);
  });
});
