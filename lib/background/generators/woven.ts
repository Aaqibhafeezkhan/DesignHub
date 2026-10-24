import { backgroundFamily } from "@/lib/background/family";
import { argyle } from "@/lib/background/generators/argyle";
import { checks } from "@/lib/background/generators/checks";
import { plaid } from "@/lib/background/generators/plaid";

/** Argyle diamonds, plaid bands and checkerboard squares: textile patterns. */
export const woven = backgroundFamily(
  { kind: "woven", label: "Woven", description: "Textile patterns: argyle diamonds, plaid bands or checks." },
  [
    { ...checks, label: "Checks" },
    { ...plaid, label: "Plaid" },
    { ...argyle, label: "Argyle" },
  ],
);
