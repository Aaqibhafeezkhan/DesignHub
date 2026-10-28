import type { BackgroundCategory } from "@/types/background";

/** The picker's groups, in order, with their names. The Background Studio is not translated yet, so they live here. */
export const backgroundCategories: { id: BackgroundCategory; label: string }[] = [
  { id: "flows", label: "Waves and flows" },
  { id: "patterns", label: "Patterns" },
  { id: "shapes", label: "Shapes" },
  { id: "textures", label: "Textures" },
  { id: "maps", label: "Maps and tech" },
];
