import { contrastRatio, fromHex, oklch, readableTextColor, toHex } from "@/lib/color/color";
import { suggestForeground } from "@/lib/color/contrast";
import type { Oklch } from "@/types/color";
import type { DesignTokens } from "@/types/tokens";
import { mixToward, roleColor } from "@/lib/tokens/formats/shared-native";
import { defineFormat } from "@/lib/tokens/formats/define";

/* ------------------------------------------------------------------ VS Code */

/**
 * Smallest lightness change (or black / white fallback) that reaches WCAG AA on `background`.
 * Checks contrast after hex round-trip, because `toHex` can drop a borderline color just under
 * the target.
 */
function readableOn(foreground: Oklch, background: Oklch, target = 4.5): Oklch {
  const passes = (color: Oklch) => contrastRatio(fromHex(toHex(color)), background) >= target;
  if (passes(foreground)) return foreground;
  // Aim slightly above the target so 8-bit hex rounding still clears it.
  const adjusted = suggestForeground(foreground, background, target + 0.05) ?? readableTextColor(background);
  if (passes(adjusted)) return adjusted;
  return readableTextColor(background);
}

type VsCodeTokenRule = { scope: string[]; settings: { foreground: string; fontStyle?: string } };

/**
 * VS Code color theme (`brand-color-theme.json`): workbench `colors` for the editor, sidebar and
 * status bar, plus `tokenColors` for comments, strings, keywords, functions and numbers, built from
 * the semantic roles. `type` is `light` or `dark` from the background, and every syntax color meets
 * WCAG AA (4.5:1) against that background.
 */
export function toVsCodeTheme(tokens: DesignTokens): string {
  const white = oklch(1, 0, 0);
  const black = oklch(0.145, 0, 0);
  // Background and foreground come from the semantic roles as authored. Dark mode in roleColor()
  // would swap them, which is wrong when the brand background is already dark.
  const background = tokens.semantic.find((item) => item.name === "background")?.value ?? white;
  const type: "light" | "dark" =
    contrastRatio(background, white) >= contrastRatio(background, black) ? "dark" : "light";
  const dark = type === "dark";
  const foreground = tokens.semantic.find((item) => item.name === "foreground")?.value ?? (dark ? white : black);
  // Primary and accent may lift to a lighter shade on a dark background for readability.
  const primary = roleColor(tokens, "primary", dark)?.value ?? foreground;
  const accent = roleColor(tokens, "accent", dark)?.value ?? primary;
  const editorBg = background;
  const editorFg = readableOn(foreground, editorBg);
  const sidebarBg = mixToward(editorBg, foreground, dark ? 0.05 : 0.02);
  const sidebarFg = readableOn(foreground, sidebarBg);
  const statusBg = primary;
  const statusFg = toHex(readableTextColor(statusBg));
  // Extra brand colors for functions and numbers when the palette has more than primary / accent.
  const surfaces = new Set(
    tokens.semantic.filter((item) => item.name === "background" || item.name === "foreground").map((r) => r.ref),
  );
  const brand = tokens.colors
    .filter((color) => !surfaces.has(color.name))
    .map((color) => {
      const lifted = dark
        ? (color.shades.find((s) => s.step === 300) ?? color.shades.find((s) => s.step === 200))
        : undefined;
      return lifted?.value ?? color.value;
    });
  const functionColor = brand[1] ?? mixToward(primary, accent, 0.5);
  const numberColor = brand[2] ?? accent;
  const commentColor = mixToward(foreground, editorBg, 0.35);

  const tokenColors: VsCodeTokenRule[] = [
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: { foreground: toHex(readableOn(commentColor, editorBg)), fontStyle: "italic" },
    },
    {
      scope: ["string", "string.quoted"],
      settings: { foreground: toHex(readableOn(accent, editorBg)) },
    },
    {
      scope: ["keyword", "storage.type", "storage.modifier"],
      settings: { foreground: toHex(readableOn(primary, editorBg)) },
    },
    {
      scope: ["entity.name.function", "support.function"],
      settings: { foreground: toHex(readableOn(functionColor, editorBg)) },
    },
    {
      scope: ["constant.numeric", "constant.language.numeric"],
      settings: { foreground: toHex(readableOn(numberColor, editorBg)) },
    },
  ];

  const theme = {
    name: tokens.meta.name,
    type,
    colors: {
      "editor.background": toHex(editorBg),
      "editor.foreground": toHex(editorFg),
      "sideBar.background": toHex(sidebarBg),
      "sideBar.foreground": toHex(sidebarFg),
      "statusBar.background": toHex(statusBg),
      "statusBar.foreground": statusFg,
    },
    tokenColors,
  };

  return `${JSON.stringify(theme, null, 2)}\n`;
}

export const vscodeFormat = defineFormat({
  id: "vscode",
  label: "VS Code",
  filename: "brand-color-theme.json",
  language: "json",
  generate: toVsCodeTheme,
});
