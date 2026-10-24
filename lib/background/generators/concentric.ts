import { backgroundFamily } from "@/lib/background/family";
import { arcs } from "@/lib/background/generators/arcs";
import { rings } from "@/lib/background/generators/rings";
import { squares } from "@/lib/background/generators/squares";

/** Rings, arcs and squares spreading from a seeded center. */
export const concentric = backgroundFamily(
  { kind: "concentric", label: "Concentric", description: "Rings, arcs or squares spreading from a seeded center." },
  [
    { ...rings, label: "Rings" },
    { ...arcs, label: "Arcs" },
    { ...squares, label: "Squares" },
  ],
);
