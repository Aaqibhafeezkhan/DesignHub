import type { Oklch } from "@/types/color";
import type { DesignTokens } from "@/types/tokens";
import { colorEntries, headerText, ident, px, roleColor, unique, xamlColor } from "@/lib/tokens/formats/shared-native";
import { defineFormat } from "@/lib/tokens/formats/define";

/* ---------------------------------------------------------------- Qt Quick */

/** QML property names start with a lowercase letter, so "Indigo" becomes "indigo". */
const qmlMember = (id: string) => `${id[0]!.toLowerCase()}${id.slice(1)}`;

/**
 * Qt Quick (Theme.qml): a singleton `QtObject` with the palette, the semantic roles in light and
 * dark, and spacing and radius numbers. Register it in qmldir with `singleton Theme 1.0 Theme.qml`.
 * Colors are `#AARRGGBB` strings, the order Qt expects.
 */
export function toQtQuickTheme(tokens: DesignTokens): string {
  const palette = unique(colorEntries(tokens, "c").map((color) => ({ ...color, id: qmlMember(color.id) })));
  const roles = unique(
    tokens.semantic.flatMap((role) =>
      [false, true].flatMap((dark) => {
        const resolved = roleColor(tokens, role.name, dark);
        return resolved
          ? [{ id: qmlMember(ident(`${dark ? "dark" : "light"} ${role.name}`, "r")), value: resolved.value }]
          : [];
      }),
    ),
  );
  const numbers = (items: { name: string; px: number }[], prefix: string, digitPrefix: string) =>
    unique(items.map((item) => ({ id: qmlMember(ident(`${prefix} ${item.name}`, digitPrefix)), px: item.px })));

  const colorLine = (color: { id: string; value: Oklch; comment?: string }) =>
    `    readonly property color ${color.id}: ${JSON.stringify(xamlColor(color.value))}${color.comment ? ` // ${color.comment}` : ""}`;
  const numberLine = (item: { id: string; px: number }) => `    readonly property real ${item.id}: ${px(item.px)}`;
  const section = (lines: string[]) => lines.join("\n");

  return `pragma Singleton
// ${headerText(tokens)}
// Register it in qmldir: singleton Theme 1.0 Theme.qml
import QtQuick

QtObject {
${section(palette.map(colorLine))}

${section(roles.map(colorLine))}

${section(numbers(tokens.spacing, "spacing", "s").map(numberLine))}

${section(numbers(tokens.radius, "radius", "r").map(numberLine))}
}
`;
}

export const qmlFormat = defineFormat({
  id: "qml",
  label: "Qt Quick",
  filename: "Theme.qml",
  language: "qml",
  generate: toQtQuickTheme,
});
