import { hexToRgba, px } from "@/lib/effects/css";
import { defineEffect } from "@/lib/effects/define";

/**
 * Shadows at the top and bottom of a scrollable box that show only while there is more to scroll,
 * in pure CSS. Two surface-colored covers use `background-attachment: local`, so they scroll with the
 * content and hide the two fixed shadows underneath once the box is at that end.
 */
export const scrollShadow = defineEffect({
  kind: "scroll-shadow",
  category: "states",
  label: "Scroll shadow",
  description: "Edge shadows that appear only while there is more content to scroll, with no JavaScript.",
  generate(s) {
    const cover = hexToRgba(s.surface, 1);
    const clear = hexToRgba(s.surface, 0);
    const shadow = hexToRgba(s.color, s.opacity);
    const shadowClear = hexToRgba(s.color, 0);
    return {
      declarations: [
        {
          property: "background-image",
          value: [
            `linear-gradient(${cover} 30%, ${clear})`,
            `linear-gradient(${clear}, ${cover} 70%)`,
            `radial-gradient(farthest-side at 50% 0, ${shadow}, ${shadowClear})`,
            `radial-gradient(farthest-side at 50% 100%, ${shadow}, ${shadowClear})`,
          ].join(", "),
        },
        { property: "background-position", value: "center top, center bottom, center top, center bottom" },
        {
          property: "background-size",
          value: `100% ${px(s.size * 3)}, 100% ${px(s.size * 3)}, 100% ${px(s.size)}, 100% ${px(s.size)}`,
        },
        { property: "background-repeat", value: "no-repeat" },
        { property: "background-attachment", value: "local, local, scroll, scroll" },
        { property: "background-color", value: s.surface },
      ],
      fill: s.surface,
      tailwindNote:
        "Put the classes on the scrollable element; it needs a fixed height (or max-height) and overflow: auto.",
      extra: (selector) => `${selector} {
  overflow-y: auto;
}`,
    };
  },
});
