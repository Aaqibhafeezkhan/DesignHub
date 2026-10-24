import { toRgb } from "@/lib/color/color";
import type { Oklch } from "@/types/color";
import type { DesignTokens } from "@/types/tokens";
import { colorEntries, headerText, ident, pascal, px, unique, weight } from "@/lib/tokens/formats/shared-native";
import { defineFormat } from "@/lib/tokens/formats/define";

/* ------------------------------------------------------------------ SwiftUI */

const round3 = (value: number) => Math.round(value * 1000) / 1000;

const swiftString = (value: string) => `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

function swiftColor(value: Oklch): string {
  const { r, g, b, alpha } = toRgb(value);
  const channels = `red: ${round3(r / 255)}, green: ${round3(g / 255)}, blue: ${round3(b / 255)}`;
  return `Color(${channels}${alpha < 1 ? `, opacity: ${round3(alpha)}` : ""})`;
}

/**
 * SwiftUI: colors as `Color` extensions (prefixed with the brand, so they never clash with
 * system colors such as `Color.indigo`), plus spacing, radius and font helpers.
 */
export function toSwiftUITheme(tokens: DesignTokens): string {
  const name = pascal(tokens.meta.name);
  const prefix = name[0]!.toLowerCase() + name.slice(1);
  // Prefixing upper-cases the first letter, so "indigo" and "Indigo" are de-duplicated again after it.
  const colors = unique(
    colorEntries(tokens, "c").map((color) => ({
      ...color,
      id: `${prefix}${color.id[0]!.toUpperCase()}${color.id.slice(1)}`,
    })),
  );
  const t = tokens.typography;
  const lets = (items: { name: string; px: number }[]) =>
    unique(items.map((item) => ({ id: ident(item.name, "s"), px: item.px })))
      .map((item) => `    static let ${item.id}: CGFloat = ${px(item.px)}`)
      .join("\n");

  const fonts = t
    ? `
enum ${name}Font {
    static let headingFamily = ${swiftString(t.heading.family)}
    static let bodyFamily = ${swiftString(t.body.family)}

    /// Font files must be added to the app target and listed under UIAppFonts in Info.plist.
    static func heading(_ size: CGFloat) -> Font { .custom(headingFamily, size: size).weight(.${swiftWeight(t.rhythm.headingWeight)}) }
    static func body(_ size: CGFloat) -> Font { .custom(bodyFamily, size: size) }

${unique(t.steps.map((step) => ({ id: ident(step.name, "size"), step })))
  .map(({ id, step }) => `    static let ${id} = ${step.maxPx >= 24 ? "heading" : "body"}(${px(step.maxPx)})`)
  .join("\n")}
}
`
    : "";

  return `// ${headerText(tokens)}
import SwiftUI

extension Color {
${colors.map((color) => `    static let ${color.id} = ${swiftColor(color.value)}${color.comment ? ` // ${color.comment}` : ""}`).join("\n")}
}

enum ${name}Spacing {
${lets(tokens.spacing)}
}

enum ${name}Radius {
${lets(tokens.radius)}
}
${fonts}`;
}

function swiftWeight(value: number): string {
  const names: Record<number, string> = {
    100: "ultraLight",
    200: "thin",
    300: "light",
    400: "regular",
    500: "medium",
    600: "semibold",
    700: "bold",
    800: "heavy",
    900: "black",
  };
  return names[weight(value)] ?? "regular";
}

export const swiftuiFormat = defineFormat({
  id: "swiftui",
  label: "SwiftUI",
  filename: "Theme.swift",
  language: "swift",
  generate: toSwiftUITheme,
});
