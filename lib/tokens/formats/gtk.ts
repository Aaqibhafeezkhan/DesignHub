import { oklch, readableTextColor, toHex } from "@/lib/color/color";
import type { Oklch } from "@/types/color";
import type { DesignTokens } from "@/types/tokens";
import { header } from "@/lib/tokens/formats/shared";
import { roleColor } from "@/lib/tokens/formats/shared-native";
import { defineFormat } from "@/lib/tokens/formats/define";

/**
 * GTK 4 / libadwaita (gtk.css): `@define-color` entries for the accent, window and view colors.
 * The light block is the default and the dark block sits in a `prefers-color-scheme: dark`
 * media query (GTK 4.20 and newer). On older GTK, move the dark block into gtk-dark.css.
 */
export function toGtkCss(tokens: DesignTokens): string {
  const block = (dark: boolean) => {
    const background = roleColor(tokens, "background", dark)?.value ?? (dark ? oklch(0.145, 0, 0) : oklch(1, 0, 0));
    const foreground = roleColor(tokens, "foreground", dark)?.value ?? (dark ? oklch(0.985, 0, 0) : oklch(0.145, 0, 0));
    const accent = roleColor(tokens, "primary", dark)?.value ?? foreground;
    const card = roleColor(tokens, "card", dark)?.value ?? background;
    const entries: [string, Oklch][] = [
      ["accent_bg_color", accent],
      ["accent_fg_color", readableTextColor(accent)],
      ["accent_color", accent],
      ["window_bg_color", background],
      ["window_fg_color", foreground],
      ["view_bg_color", card],
      ["view_fg_color", foreground],
    ];
    return entries.map(([name, value]) => `@define-color ${name} ${toHex(value)};`);
  };
  const dark = block(true)
    .map((line) => `  ${line}`)
    .join("\n");
  return `${header(tokens, (text) => `/* ${text} */`)}
/* GTK 4 and libadwaita named colors. Save as ~/.config/gtk-4.0/gtk.css. */

${block(false).join("\n")}

@media (prefers-color-scheme: dark) {
${dark}
}
`;
}

export const gtkFormat = defineFormat({
  id: "gtk",
  label: "GTK 4 CSS",
  filename: "gtk.css",
  language: "css",
  generate: toGtkCss,
});
