import type { Oklch } from "@/types/color";
import type { DesignTokens } from "@/types/tokens";
import type { ColorEntry } from "@/lib/tokens/formats/shared-native";
import { headerText, ident, pascal, roleColor, unique, xamlColor, xmlText } from "@/lib/tokens/formats/shared-native";
import { defineFormat } from "@/lib/tokens/formats/define";

/**
 * WinUI / WPF (Theme.xaml): a `ResourceDictionary` with a `Color` and a `SolidColorBrush` for every
 * palette color and shade, and `ThemeDictionaries` for Light and Dark holding the semantic roles.
 * Keys are prefixed with the brand and reuse the SwiftUI and Flutter shade naming (indigo_250 vs
 * indigo2_50), so two tokens never share a key. Colors are ARGB hex.
 */
export function toWinUiTheme(tokens: DesignTokens): string {
  const name = pascal(tokens.meta.name);
  const key = (id: string) => `${name}${id[0]!.toUpperCase()}${id.slice(1)}`;
  const entry = (id: string, value: Oklch, indent: string, comment?: string) =>
    `${indent}<Color x:Key="${id}Color">${xamlColor(value)}</Color>${comment ? ` <!-- ${xmlText(comment.replace(/-{2,}/g, "-"))} -->` : ""}\n` +
    `${indent}<SolidColorBrush x:Key="${id}Brush" Color="${xamlColor(value)}" />`;

  const palette: ColorEntry[] = [];
  tokens.colors.forEach((color) => {
    palette.push({ id: ident(color.name, "c"), key: color.name, value: color.value });
    color.shades.forEach((shade) =>
      palette.push({
        id: ident(`${color.name}_${shade.step}`, "c"),
        key: `${color.name}/${shade.step}`,
        value: shade.value,
      }),
    );
  });
  const colors = unique(palette.map((item) => ({ ...item, id: key(item.id) })));
  const roles = (dark: boolean) =>
    unique(
      tokens.semantic.flatMap((role) => {
        const resolved = roleColor(tokens, role.name, dark);
        return resolved ? [{ id: `${key(ident(role.name, "r"))}Role`, value: resolved.value }] : [];
      }),
    );
  const theme = (dark: boolean) =>
    `    <ResourceDictionary x:Key="${dark ? "Dark" : "Light"}">\n${roles(dark)
      .map((role) => entry(role.id, role.value, "      "))
      .join("\n")}\n    </ResourceDictionary>`;

  return `<?xml version="1.0" encoding="utf-8"?>
<!-- ${xmlText(headerText(tokens).replace(/-{2,}/g, "-"))} -->
<!-- Merge this into App.xaml: Application.Resources > ResourceDictionary.MergedDictionaries. -->
<ResourceDictionary xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
                    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">
  <ResourceDictionary.ThemeDictionaries>
${theme(false)}
${theme(true)}
  </ResourceDictionary.ThemeDictionaries>

${colors.map((color) => entry(color.id, color.value, "  ")).join("\n")}
</ResourceDictionary>
`;
}

export const winuiFormat = defineFormat({
  id: "winui",
  label: "WinUI / WPF",
  filename: "Theme.xaml",
  language: "xml",
  generate: toWinUiTheme,
});
