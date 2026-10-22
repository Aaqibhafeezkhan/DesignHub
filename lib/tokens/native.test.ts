import { describe, expect, test } from "vitest";

import { contrastRatio, fromHex } from "@/lib/color/color";
import {
  toComposeTheme,
  toFlutterTheme,
  toGodotTheme,
  toQtQuickTheme,
  toSwiftUITheme,
  toTokensStudio,
  toVsCodeTheme,
  toWindowsTerminalScheme,
} from "@/lib/tokens/native";
import type { DesignTokens } from "@/types/tokens";

const shade = (step: number, hex: string) => ({ step, value: fromHex(hex) });

/** Two palette names that used to collide: "indigo" shade 250 and "indigo-2" shade 50. */
const tokens: DesignTokens = {
  meta: { name: "Acme Labs", prefix: "", generatedAt: "2026-01-01", colorFormat: "hex" },
  colors: [
    { name: "indigo", value: fromHex("#0f172a"), shades: [shade(50, "#f3f7fe"), shade(250, "#cdd9f3")] },
    { name: "indigo-2", value: fromHex("#6366f1"), shades: [shade(50, "#f1f6ff")] },
  ],
  semantic: [{ name: "primary", ref: "indigo-2", value: fromHex("#6366f1") }],
  gradient: null,
  typography: null,
  effects: [],
  spacing: [
    { name: "0.5", px: 2 },
    { name: "4", px: 16 },
  ],
  radius: [
    { name: "lg", px: 12 },
    { name: "full", px: 9999 },
  ],
};

const identifiers = (code: string, pattern: RegExp) => [...code.matchAll(pattern)].map((match) => match[1]);

describe("native formats", () => {
  test("Flutter identifiers are unique and valid", () => {
    const code = toFlutterTheme(tokens);
    const ids = identifiers(code, /static const (?:double )?([A-Za-z_][A-Za-z0-9_]*) =/g);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(expect.arrayContaining(["indigo_250", "indigo2_50", "s0_5", "s4", "full"]));
    expect(code).toContain("class AcmeLabsColors");
    expect(code).toContain("Color(0xFF6366F1)");
  });

  test("SwiftUI colors are unique and brand-prefixed", () => {
    const code = toSwiftUITheme(tokens);
    const ids = identifiers(code, /static let ([A-Za-z_][A-Za-z0-9_]*)/g);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(expect.arrayContaining(["acmeLabsIndigo_250", "acmeLabsIndigo2_50", "acmeLabsPrimary"]));
    expect(code).not.toMatch(/static let indigo\b/);
  });

  test("Compose colors are unique PascalCase members referenced by the color schemes", () => {
    const code = toComposeTheme(tokens);
    const colors = code.slice(code.indexOf("object AcmeLabsColors {"), code.indexOf("object AcmeLabsSpacing"));
    const ids = identifiers(colors, /val ([A-Za-z_][A-Za-z0-9_]*) =/g);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(expect.arrayContaining(["Indigo_250", "Indigo2_50", "Primary"]));
    expect(colors).toContain("val Indigo2 = Color(0xFF6366F1)");
    expect(code).toMatch(/val AcmeLabsLightColorScheme = lightColorScheme\(\n {4}primary = AcmeLabsColors\.Primary,/);
    // Dark mode has no 300 or 200 shade of indigo-2 here, so it keeps the primary role.
    expect(code).toMatch(/darkColorScheme\(\n {4}primary = AcmeLabsColors\.Primary,/);
    expect(code).toContain("@Composable\nfun AcmeLabsTheme(");
  });

  test("Compose shapes use the radius tokens and spacing is in dp", () => {
    const code = toComposeTheme(tokens);
    expect(code).toContain("    val Lg = 12.dp\n    val Full = 9999.dp");
    expect(code).toContain("    val S0_5 = 2.dp\n    val S4 = 16.dp");
    expect(code).toContain("val AcmeLabsShapes = Shapes(\n    medium = RoundedCornerShape(AcmeLabsRadius.Lg),\n)");
  });

  test("Compose dark scheme lifts brand colors to a lighter shade and never shadows Color", () => {
    const code = toComposeTheme({
      ...tokens,
      colors: [{ name: "color", value: fromHex("#6366f1"), shades: [shade(300, "#a5b4fc")] }],
      semantic: [{ name: "primary", ref: "color", value: fromHex("#6366f1") }],
      radius: [],
    });
    expect(code).toContain("val Color_ = Color(0xFF6366F1)");
    expect(code).toMatch(/darkColorScheme\(\n {4}primary = AcmeLabsColors\.Color_300,\n {4}onPrimary = Color\.Black,/);
    expect(code).toContain("val AcmeLabsShapes = Shapes()");
  });

  test("Qt Quick properties are valid, unique identifiers with ARGB colors", () => {
    const code = toQtQuickTheme(tokens);
    const ids = identifiers(code, /readonly property (?:color|real) ([A-Za-z_][A-Za-z0-9_]*)/g);
    expect(new Set(ids).size).toBe(ids.length);
    expect(code.startsWith("pragma Singleton")).toBe(true);
    expect(code).toContain("QtObject {");
    expect(code).toContain('readonly property color indigo_250: "#FFCDD9F3"');
    expect(code).toContain('readonly property color lightPrimary: "#FF6366F1"');
    expect(code).toContain('readonly property color darkPrimary: "#FF6366F1"');
    expect(code).toContain("readonly property real spacing0_5: 2");
  });

  test("Godot Theme colors are unique with Color(r, g, b, a) floats", () => {
    const code = toGodotTheme(tokens);
    const ids = identifiers(code, /AcmeLabs\/colors\/([A-Za-z_][A-Za-z0-9_]*)/g);
    expect(new Set(ids).size).toBe(ids.length);
    expect(code.startsWith('[gd_resource type="Theme"')).toBe(true);
    expect(code).toContain("AcmeLabs/colors/indigo_250 = Color(");
    expect(code).toContain("AcmeLabs/colors/light_primary = Color(");
    expect(code).toMatch(/Color\([0-9.]+, [0-9.]+, [0-9.]+, [0-9.]+\)/);
  });

  test("Windows Terminal scheme has sixteen ANSI colors and 4.5:1 text", () => {
    const scheme = JSON.parse(toWindowsTerminalScheme(tokens)).schemes[0] as Record<string, string>;
    expect(scheme.name).toBe("Acme Labs");
    for (const key of [
      "black",
      "red",
      "green",
      "yellow",
      "blue",
      "purple",
      "cyan",
      "white",
      "brightBlack",
      "brightRed",
      "brightGreen",
      "brightYellow",
      "brightBlue",
      "brightPurple",
      "brightCyan",
      "brightWhite",
    ]) {
      expect(scheme[key]).toMatch(/^#[0-9a-f]{6}$/i);
    }
    expect(contrastRatio(fromHex(scheme.foreground!), fromHex(scheme.background!))).toBeGreaterThanOrEqual(4.5);
  });

  test("VS Code theme maps semantic roles into workbench colors and readable tokenColors", () => {
    const themed: DesignTokens = {
      ...tokens,
      colors: [
        { name: "indigo", value: fromHex("#6366f1"), shades: [shade(300, "#a5b4fc")] },
        { name: "amber", value: fromHex("#f59e0b"), shades: [] },
        { name: "slate", value: fromHex("#0f172a"), shades: [] },
      ],
      semantic: [
        { name: "primary", ref: "indigo", value: fromHex("#6366f1") },
        { name: "accent", ref: "amber", value: fromHex("#f59e0b") },
        { name: "foreground", ref: "slate", value: fromHex("#0f172a") },
        { name: "background", ref: "white", value: fromHex("#ffffff") },
      ],
    };
    const theme = JSON.parse(toVsCodeTheme(themed)) as {
      type: string;
      colors: Record<string, string>;
      tokenColors: { scope: string[]; settings: { foreground: string } }[];
    };
    expect(theme.type).toBe("light");
    expect(theme.colors["editor.background"]).toBe("#ffffff");
    expect(theme.colors["statusBar.background"]).toBe("#6366f1");
    expect(theme.tokenColors.some((rule) => rule.scope.some((scope) => scope.includes("comment")))).toBe(true);
    expect(theme.tokenColors.some((rule) => rule.scope.some((scope) => scope.includes("string")))).toBe(true);
    expect(theme.tokenColors.some((rule) => rule.scope.some((scope) => scope.includes("keyword")))).toBe(true);
    expect(theme.tokenColors.some((rule) => rule.scope.some((scope) => scope.includes("function")))).toBe(true);
    expect(theme.tokenColors.some((rule) => rule.scope.some((scope) => /numeric|number/.test(scope)))).toBe(true);
    const background = fromHex(theme.colors["editor.background"]!);
    theme.tokenColors.forEach((rule) => {
      expect(contrastRatio(fromHex(rule.settings.foreground), background)).toBeGreaterThanOrEqual(4.5);
    });
  });

  test("Tokens Studio resolves semantic aliases into the palette", () => {
    const json = JSON.parse(toTokensStudio(tokens));
    expect(json.global.color["indigo-2"]["50"]).toEqual({ value: "#f1f6ff", type: "color" });
    expect(json.global.semantic.primary.value).toBe("{color.indigo-2.base}");
    expect(json.global.spacing["0_5"]).toEqual({ value: "2", type: "spacing" });
    expect(json.$metadata.tokenSetOrder).toEqual(["global"]);
  });
});
