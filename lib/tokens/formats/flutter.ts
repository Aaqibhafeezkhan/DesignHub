import type { DesignTokens } from "@/types/tokens";
import {
  argbColor,
  colorEntries,
  headerText,
  ident,
  pascal,
  px,
  unique,
  weight,
} from "@/lib/tokens/formats/shared-native";
import { defineFormat } from "@/lib/tokens/formats/define";

/* ------------------------------------------------------------------ Flutter */

/** Material text theme slots for each step of the type scale, smallest to largest. */
const flutterSlots: Record<string, string> = {
  xs: "labelSmall",
  sm: "bodySmall",
  base: "bodyMedium",
  lg: "bodyLarge",
  xl: "titleLarge",
  "2xl": "headlineSmall",
  "3xl": "headlineMedium",
  "4xl": "headlineLarge",
  "5xl": "displaySmall",
  "6xl": "displayMedium",
};

const dartString = (value: string) => `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;

/** Flutter: color, spacing, radius and font constants plus a Material 3 `ThemeData`. */
export function toFlutterTheme(tokens: DesignTokens): string {
  const name = pascal(tokens.meta.name);
  const lower = name[0]!.toLowerCase() + name.slice(1);
  const colors = colorEntries(tokens, "c");
  const primary = tokens.semantic.find((role) => role.name === "primary")?.value ?? tokens.colors[0]?.value;
  const t = tokens.typography;

  const colorLines = colors
    .map(
      (color) =>
        `  static const ${color.id} = ${argbColor(color.value)};${color.comment ? ` // ${color.comment}` : ""}`,
    )
    .join("\n");
  const doubles = (items: { name: string; px: number }[]) =>
    unique(items.map((item) => ({ id: ident(item.name, "s"), px: item.px })))
      .map((item) => `  static const double ${item.id} = ${px(item.px)};`)
      .join("\n");
  const textStyles = t
    ? t.steps
        .filter((step) => flutterSlots[step.name])
        .map((step) => {
          const heading = step.maxPx >= 24;
          const family = heading ? `${name}Fonts.heading` : `${name}Fonts.body`;
          const w = weight(heading ? t.rhythm.headingWeight : t.rhythm.bodyWeight);
          const height = heading ? t.rhythm.headingLineHeight : t.rhythm.bodyLineHeight;
          return `    ${flutterSlots[step.name]}: TextStyle(fontFamily: ${family}, fontSize: ${px(step.maxPx)}, fontWeight: FontWeight.w${w}, height: ${height}),`;
        })
        .join("\n")
    : "";

  return `// ${headerText(tokens)}
// Add the fonts to pubspec.yaml (or use the google_fonts package) for the families below to load.
import 'package:flutter/material.dart';

class ${name}Colors {
  ${name}Colors._();
${colorLines}
}

class ${name}Spacing {
  ${name}Spacing._();
${doubles(tokens.spacing)}
}

class ${name}Radius {
  ${name}Radius._();
${doubles(tokens.radius)}
}
${
  t
    ? `
class ${name}Fonts {
  ${name}Fonts._();
  static const heading = ${dartString(t.heading.family)};
  static const body = ${dartString(t.body.family)};
}
`
    : ""
}
ThemeData ${lower}Theme({Brightness brightness = Brightness.light}) {
  return ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(seedColor: ${primary ? argbColor(primary) : "Colors.indigo"}, brightness: brightness),${t ? `\n    fontFamily: ${name}Fonts.body,` : ""}
    cardTheme: CardThemeData(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(${px(tokens.radius.find((r) => r.name === "lg")?.px ?? 12)}))),${
      textStyles ? `\n    textTheme: const TextTheme(\n${textStyles}\n    ),` : ""
    }
  );
}
`;
}

export const flutterFormat = defineFormat({
  id: "flutter",
  label: "Flutter",
  filename: "theme.dart",
  language: "dart",
  generate: toFlutterTheme,
});
