import { toRgb } from "@/lib/color/color";
import type { Oklch } from "@/types/color";
import type { DesignTokens } from "@/types/tokens";
import { pascal } from "@/lib/tokens/formats/shared";
import { roleColor } from "@/lib/tokens/formats/shared-native";

/** Apple writes components as decimals with three places. */
const unit = (value: number) => Math.round((value / 255) * 1000) / 1000;

function xcodeColor(value: Oklch) {
  const { r, g, b, alpha } = toRgb(value);
  return {
    "color-space": "srgb",
    components: { red: unit(r), green: unit(g), blue: unit(b), alpha: Math.round(alpha * 1000) / 1000 },
  };
}

/** One `<Name>.colorset/Contents.json` per semantic role, with a dark luminosity variant from roleColor(). */
export function toXcodeColorSets(tokens: DesignTokens): { name: string; role: string; code: string }[] {
  return tokens.semantic.flatMap((item) => {
    const light = roleColor(tokens, item.name);
    const dark = roleColor(tokens, item.name, true);
    if (!light || !dark) return [];
    const catalog = {
      colors: [
        { idiom: "universal", color: xcodeColor(light.value) },
        {
          idiom: "universal",
          appearances: [{ appearance: "luminosity", value: "dark" }],
          color: xcodeColor(dark.value),
        },
      ],
      info: { author: "xcode", version: 1 },
    };
    return [{ name: pascal(item.name), role: item.name, code: `${JSON.stringify(catalog, null, 2)}\n` }];
  });
}
