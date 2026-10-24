import type { Oklch } from "@/types/color";
import type { DesignTokens } from "@/types/tokens";
import { androidArgb, androidColorResources, androidResource, pascal, xmlHeader } from "@/lib/tokens/formats/shared";
import { materialSlots } from "@/lib/tokens/formats/shared-native";
import { defineFormat } from "@/lib/tokens/formats/define";

/** Material 3 theme attribute for a slot. Only the window background lives in the android namespace. */
const materialAttribute = (slot: string) =>
  slot === "background" ? "android:colorBackground" : `color${slot.charAt(0).toUpperCase()}${slot.slice(1)}`;

/**
 * Android Material 3 theme: `res/values/themes.xml`, or `res/values-night/themes.xml` when `dark`.
 * The slots come from materialSlots(), the same mapping the Compose export uses. Colors that exist
 * in colors.xml are referenced as `@color/...`; derived ones (outline, containers) are written inline.
 */
export function toAndroidTheme(tokens: DesignTokens, dark = false): string {
  const resources = androidColorResources(tokens);
  const reference = (key: string | undefined, value: Oklch) => {
    if (key === "white") return "@android:color/white";
    if (key === "black") return "@android:color/black";
    const id = key ? androidResource(tokens, key.startsWith("role:") ? key.slice(5) : key.replace("/", "_")) : "";
    const stored = resources.get(id);
    // A resource that lost its name to an earlier token holds another color, so write the value instead.
    return stored && androidArgb(stored) === androidArgb(value) ? `@color/${id}` : androidArgb(value);
  };
  const items = materialSlots(tokens, dark).map(
    (slot) => `        <item name="${materialAttribute(slot.slot)}">${reference(slot.key, slot.value)}</item>`,
  );
  return `<?xml version="1.0" encoding="utf-8"?>
${xmlHeader(tokens)}
<resources>
    <style name="Theme.${pascal(tokens.meta.name) || "Brand"}" parent="Theme.Material3.DayNight.NoActionBar">
${items.join("\n")}
    </style>
</resources>
`;
}

export const androidThemeFormat = defineFormat({
  id: "android-theme",
  label: "Android Material 3 theme",
  filename: "themes.xml",
  language: "xml",
  generate: toAndroidTheme,
});
export const androidThemeNightFormat = defineFormat({
  id: "android-theme-night",
  label: "Android Material 3 theme (night)",
  filename: "values-night/themes.xml",
  language: "xml",
  generate: (tokens) => toAndroidTheme(tokens, true),
});
