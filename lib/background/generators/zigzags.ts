import { backgroundFamily } from "@/lib/background/family";
import { chevron } from "@/lib/background/generators/chevron";
import { squiggle } from "@/lib/background/generators/squiggle";
import { zigzag } from "@/lib/background/generators/zigzag";

/** Fine zigzags, bold chevron rows and short wavy strokes. */
export const zigzags = backgroundFamily(
  {
    kind: "zigzag",
    category: "patterns",
    label: "Zigzag",
    description: "Rows of zigzags, chevrons or short wavy strokes.",
  },
  [
    { ...zigzag, label: "Zigzag" },
    { ...chevron, label: "Chevron" },
    { ...squiggle, label: "Squiggle" },
  ],
);
