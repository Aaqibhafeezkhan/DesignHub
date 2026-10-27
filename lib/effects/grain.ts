import { defineEffect } from "@/lib/effects/define";
import { px } from "@/lib/effects/css";

/** Grayscale fractal noise tile, URL-encoded for CSS. */
function noiseDataUri(frequency: number): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='${frequency}' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>`;
  return `url("data:image/svg+xml,${svg.replace(/</g, "%3C").replace(/>/g, "%3E")}")`;
}

export const grain = defineEffect({
  kind: "grain",
  label: "Grain",
  description: "Film-grain texture overlay via a pseudo-element.",
  generate(s) {
    return {
      declarations: [
        { property: "position", value: "relative" },
        { property: "isolation", value: "isolate" },
        { property: "overflow", value: "hidden" },
      ],
      tailwindNote: "The grain itself lives in ::after - copy the ::after rule from the CSS tab.",
      extra: (selector) => `${selector}::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  border-radius: inherit;
  background-image: ${noiseDataUri(s.frequency)};
  background-size: ${px(s.scale)};
  opacity: ${s.opacity};
  mix-blend-mode: ${s.blend};
}`,
    };
  },
});
