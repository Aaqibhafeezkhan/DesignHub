import { hexToRgba, px } from "@/lib/effects/css";
import { defineEffect } from "@/lib/effects/define";
import type { CardTiltSettings } from "@/types/effects";

/** Custom properties a page can set from the pointer position. Without them the card tilts by `maxTilt`. */
export const TILT_PROPERTIES = ["--tilt-x", "--tilt-y", "--glare-x", "--glare-y"] as const;

/** Moves the tilt and the glare with the pointer. Optional: the effect tilts on hover with no script. */
export function tiltSnippet(maxTilt: number): string {
  return `Optional: follow the pointer. The card tilts on hover without this script.
const card = document.querySelector("#your-card");
card.addEventListener("pointermove", (event) => {
  const box = card.getBoundingClientRect();
  const x = (event.clientX - box.left) / box.width;
  const y = (event.clientY - box.top) / box.height;
  card.style.setProperty("--tilt-x", ((0.5 - y) * 2 * ${maxTilt}) + "deg");
  card.style.setProperty("--tilt-y", ((x - 0.5) * 2 * ${maxTilt}) + "deg");
  card.style.setProperty("--glare-x", (x * 100) + "%");
  card.style.setProperty("--glare-y", (y * 100) + "%");
});
card.addEventListener("pointerleave", () => {
  for (const name of ${JSON.stringify(TILT_PROPERTIES)}) card.style.removeProperty(name);
});`;
}

/**
 * A perspective tilt on hover with a glare that follows the light. The tilt is a transform that
 * transitions on `:hover`, and its angles come from `--tilt-x` and `--tilt-y` with `maxTilt` as the
 * fallback, so a plain hover works with no script. The glare is a `::after` radial gradient placed
 * by `--glare-x` and `--glare-y`. Under `prefers-reduced-motion` no transform or transition applies.
 */
export const cardTilt = defineEffect({
  kind: "card-tilt",
  label: "Card tilt",
  description: "A perspective hover tilt with a moving glare, static under reduced motion.",
  generate(s: CardTiltSettings) {
    const timing = `${s.duration}ms cubic-bezier(0.16, 1, 0.3, 1)`;
    const glare = hexToRgba("#ffffff", s.glare);
    return {
      declarations: [
        { property: "position", value: "relative" },
        { property: "overflow", value: "hidden" },
        { property: "background-color", value: s.fill },
        { property: "border-radius", value: px(s.radius) },
        { property: "transform", value: `perspective(${px(s.perspective)}) rotateX(0deg) rotateY(0deg)` },
        { property: "transition", value: `transform ${timing}` },
        { property: "will-change", value: "transform" },
      ],
      needsFill: true,
      tailwindNote:
        "The hover tilt and the glare are separate rules: copy them from the CSS tab, or use the @utility or SCSS output.",
      extra: (selector) =>
        [
          `${selector}:hover {
  transform: perspective(${px(s.perspective)}) rotateX(var(--tilt-x, ${s.maxTilt}deg)) rotateY(var(--tilt-y, ${-s.maxTilt}deg));
}`,
          `${selector}::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(circle at var(--glare-x, 30%) var(--glare-y, 20%), ${glare}, transparent 60%);
  opacity: 0;
  transition: opacity ${s.duration}ms ease-out;
  pointer-events: none;
}`,
          `${selector}:hover::after {
  opacity: 1;
}`,
          `@media (prefers-reduced-motion: reduce) {
  ${selector},
  ${selector}:hover {
    transform: none;
    transition: none;
  }

  ${selector}::after {
    transition: none;
  }
}`,
        ].join("\n\n"),
      global: `/*\n${tiltSnippet(s.maxTilt)}\n*/`,
    };
  },
});
