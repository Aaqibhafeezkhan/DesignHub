import type { StudioId } from "@/lib/navigation";

/**
 * What a person comes to make, and the studio that makes it. The home page shows these instead of every
 * studio at once; the full list of studios stays one click away.
 */
export const homeGoals = [
  { id: "logo", studio: "logo" },
  { id: "social", studio: "social" },
  { id: "brandBook", studio: "guidelines" },
  { id: "tokens", studio: "export" },
  { id: "palette", studio: "colors" },
  { id: "fonts", studio: "typography" },
  { id: "icon", studio: "icons" },
  { id: "background", studio: "backgrounds" },
] as const satisfies readonly { id: string; studio: StudioId }[];
