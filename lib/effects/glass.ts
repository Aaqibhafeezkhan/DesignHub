import { defineEffect } from "@/lib/effects/define";
import { hexToRgba, px } from "@/lib/effects/css";

export const glass = defineEffect({
  kind: "glass",
  category: "surfaces",
  label: "Glass",
  description: "Frosted glass: backdrop blur, tint, hairline border.",
  generate(s) {
    const filter = `blur(${px(s.blur)}) saturate(${s.saturation}%)`;
    return {
      declarations: [
        { property: "background", value: hexToRgba(s.tint, s.opacity) },
        { property: "-webkit-backdrop-filter", value: filter },
        { property: "backdrop-filter", value: filter },
        { property: "border", value: `1px solid ${hexToRgba(s.tint, s.borderOpacity)}` },
        { property: "border-radius", value: px(s.radius) },
        { property: "box-shadow", value: `0 8px 32px ${hexToRgba("#000000", s.shadowOpacity)}` },
      ],
    };
  },
});
