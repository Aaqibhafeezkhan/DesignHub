import type { DesignTokens } from "@/types/tokens";
import { androidArgb, androidColorResources, xmlHeader } from "@/lib/tokens/formats/shared";
import { defineFormat } from "@/lib/tokens/formats/define";

/** Android `res/values/colors.xml`: palette, shades and semantic roles as #AARRGGBB resources. */
export function toAndroidColors(tokens: DesignTokens): string {
  const lines = [...androidColorResources(tokens)].map(
    ([id, value]) => `    <color name="${id}">${androidArgb(value)}</color>`,
  );
  return `<?xml version="1.0" encoding="utf-8"?>\n${xmlHeader(tokens)}\n<resources>\n${lines.join("\n")}\n</resources>\n`;
}

export const androidFormat = defineFormat({
  id: "android",
  label: "Android XML",
  filename: "colors.xml",
  language: "xml",
  generate: toAndroidColors,
});
