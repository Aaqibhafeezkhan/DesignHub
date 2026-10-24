import type { Oklch } from "@/types/color";
import type { DesignTokens } from "@/types/tokens";
import type { ColorEntry } from "@/lib/tokens/formats/shared-native";
import { headerText, ident, pascal, roleColor, unique, xamlColor, xmlText } from "@/lib/tokens/formats/shared-native";
import { defineFormat } from "@/lib/tokens/formats/define";

/**
 * .NET MAUI (Colors.xaml): a `ResourceDictionary` with a `Color` and a `SolidColorBrush` for every
 * palette color and shade, and each semantic role twice (`...Role` for light, `...RoleDark` for dark,
 * to use with `AppThemeBinding`). Keys use the WinUI export's naming, so two tokens never share a key.
 */
export function toMauiColors(tokens: DesignTokens): string {
  const name = pascal(tokens.meta.name);
  const key = (id: string) => `${name}${id[0]!.toUpperCase()}${id.slice(1)}`;
  const entry = (id: string, value: Oklch) =>
    `  <Color x:Key="${id}Color">${xamlColor(value)}</Color>\n  <SolidColorBrush x:Key="${id}Brush" Color="${xamlColor(value)}" />`;
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
  const roles = tokens.semantic.flatMap((role) =>
    [false, true].flatMap((dark) => {
      const resolved = roleColor(tokens, role.name, dark);
      return resolved ? [{ id: `${key(ident(role.name, "r"))}Role${dark ? "Dark" : ""}`, value: resolved.value }] : [];
    }),
  );
  const all = unique([...palette.map((item) => ({ ...item, id: key(item.id) })), ...roles]);
  return `<?xml version="1.0" encoding="utf-8"?>
<!-- ${xmlText(headerText(tokens).replace(/-{2,}/g, "-"))} -->
<!-- Save as Resources/Styles/Colors.xaml. Use the Role and RoleDark keys with AppThemeBinding. -->
<ResourceDictionary xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
                    xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml">
${all.map((color) => entry(color.id, color.value)).join("\n")}
</ResourceDictionary>
`;
}

export const mauiFormat = defineFormat({
  id: "maui",
  label: ".NET MAUI",
  filename: "Colors.xaml",
  language: "xml",
  generate: toMauiColors,
});
