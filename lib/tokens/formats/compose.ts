import type { Oklch } from "@/types/color";
import type { DesignTokens } from "@/types/tokens";
import {
  argbColor,
  colorEntries,
  headerText,
  ident,
  materialSlots,
  pascal,
  px,
  unique,
} from "@/lib/tokens/formats/shared-native";
import { defineFormat } from "@/lib/tokens/formats/define";

/* ---------------------------------------------------------- Jetpack Compose */

const kotlinString = (value: string) => `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\$/g, "\\$")}"`;

/**
 * Kotlin keywords are all lowercase, so PascalCase members never clash with one. A member named
 * "Color" would shadow the Compose constructor inside the colors object, so it gets an underscore.
 */
function kotlinMember(id: string): string {
  const member = `${id[0]!.toUpperCase()}${id.slice(1)}`;
  return member === "Color" ? "Color_" : member;
}

const dp = (value: number) => `${px(value)}.dp`;

/** Material 3 shape slots, smallest to largest, and the radius step each one uses. */
const composeShapes: [slot: string, radius: string][] = [
  ["extraSmall", "sm"],
  ["small", "md"],
  ["medium", "lg"],
  ["large", "xl"],
  ["extraLarge", "2xl"],
];

/**
 * Jetpack Compose (Material 3): a colors object, light and dark `ColorScheme`s from the semantic
 * roles, spacing and radius `Dp` values, `Shapes` and a `<Brand>Theme` composable. Color members
 * reuse the SwiftUI and Flutter identifiers (indigo_250 vs indigo2_50) in PascalCase.
 */
export function toComposeTheme(tokens: DesignTokens): string {
  // A brand called "Material" would declare its own MaterialTheme next to the Compose one.
  const name = pascal(tokens.meta.name) === "Material" ? "MaterialBrand" : pascal(tokens.meta.name);
  const colors = unique(colorEntries(tokens, "c").map((color) => ({ ...color, id: kotlinMember(color.id) })));
  const members = new Map(colors.map((color) => [color.key, `${name}Colors.${color.id}`]));
  // Refer to the colors object where the token survived de-duplication, otherwise inline the value.
  const color = (key: string, value: Oklch) => members.get(key) ?? argbColor(value);
  const dps = (items: { name: string; px: number }[]) =>
    unique(items.map((item) => ({ id: kotlinMember(ident(item.name, "s")), name: item.name, px: item.px })));
  const spacing = dps(tokens.spacing);
  const radius = dps(tokens.radius);
  const body = (lines: string[]) => (lines.length ? `\n${lines.join("\n")}\n` : "");
  const t = tokens.typography;

  const scheme = (dark: boolean) =>
    materialSlots(tokens, dark).map((slot) => {
      const code =
        slot.key === "white"
          ? "Color.White"
          : slot.key === "black"
            ? "Color.Black"
            : slot.key
              ? color(slot.key, slot.value)
              : argbColor(slot.value);
      return `    ${slot.slot} = ${code},`;
    });
  const shapes = composeShapes.flatMap(([slot, step]) => {
    const item = radius.find((entry) => entry.name === step);
    return item ? [`    ${slot} = RoundedCornerShape(${name}Radius.${item.id}),`] : [];
  });

  return `// ${headerText(tokens)}
// Change the package to match your app. Requires Compose Material 3.
package com.example.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

object ${name}Colors {${body(
    colors.map(
      (entry) => `    val ${entry.id} = ${argbColor(entry.value)}${entry.comment ? ` // ${entry.comment}` : ""}`,
    ),
  )}}

object ${name}Spacing {${body(spacing.map((item) => `    val ${item.id} = ${dp(item.px)}`))}}

object ${name}Radius {${body(radius.map((item) => `    val ${item.id} = ${dp(item.px)}`))}}
${
  t
    ? `
/** Family names: load them with downloadable Google Fonts or add the files to res/font. */
object ${name}Fonts {
    const val Heading = ${kotlinString(t.heading.family)}
    const val Body = ${kotlinString(t.body.family)}
}
`
    : ""
}
val ${name}LightColorScheme = lightColorScheme(${body(scheme(false))})

val ${name}DarkColorScheme = darkColorScheme(${body(scheme(true))})

val ${name}Shapes = Shapes(${body(shapes)})

@Composable
fun ${name}Theme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) ${name}DarkColorScheme else ${name}LightColorScheme,
        shapes = ${name}Shapes,
        content = content,
    )
}
`;
}

export const composeFormat = defineFormat({
  id: "compose",
  label: "Jetpack Compose",
  filename: "Theme.kt",
  language: "kotlin",
  generate: toComposeTheme,
});
