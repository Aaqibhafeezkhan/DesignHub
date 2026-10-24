import { toRgb } from "@/lib/color/color";
import type { Oklch } from "@/types/color";
import type { DesignTokens } from "@/types/tokens";
import { colorEntries, headerText, ident, pascal, roleColor, unique } from "@/lib/tokens/formats/shared-native";
import { defineFormat } from "@/lib/tokens/formats/define";

/* ------------------------------------------------------------------- Godot */

/** sRGB floats 0 to 1, rounded to 3 decimal places, as Godot's `Color(r, g, b, a)` expects. */
function godotColor(value: Oklch): string {
  const { r, g, b, alpha } = toRgb(value);
  const channel = (byte: number) => Number((byte / 255).toFixed(3));
  const a = Number(alpha.toFixed(3));
  return `Color(${channel(r)}, ${channel(g)}, ${channel(b)}, ${a})`;
}

/**
 * Godot 4 (theme.tres): a `Theme` resource with `Color` entries for every palette color and shade,
 * and the semantic roles in light and dark. Colors live under a custom theme type named after the
 * brand (`theme.get_color("light_primary", "AcmeLabs")`). Values are `Color(r, g, b, a)` with 0 to 1
 * floats rounded to 3 places.
 */
export function toGodotTheme(tokens: DesignTokens): string {
  const type = pascal(tokens.meta.name);
  const palette = unique(colorEntries(tokens, "c"));
  const roles = unique(
    tokens.semantic.flatMap((role) =>
      [false, true].flatMap((dark) => {
        const resolved = roleColor(tokens, role.name, dark);
        return resolved ? [{ id: ident(`${dark ? "dark" : "light"}_${role.name}`, "r"), value: resolved.value }] : [];
      }),
    ),
  );
  const line = (id: string, value: Oklch, comment?: string) =>
    `${type}/colors/${id} = ${godotColor(value)}${comment ? ` ; ${comment}` : ""}`;

  return `[gd_resource type="Theme" format=3]

; ${headerText(tokens)}
; Assign this Theme to a Control, or Project Settings > GUI > Theme > Custom.
; Read a color with theme.get_color("light_primary", "${type}").

[resource]
${palette.map((color) => line(color.id, color.value, color.comment)).join("\n")}
${roles.map((role) => line(role.id, role.value)).join("\n")}
`;
}

export const godotFormat = defineFormat({
  id: "godot",
  label: "Godot",
  filename: "theme.tres",
  language: "text",
  generate: toGodotTheme,
});
