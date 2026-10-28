/** Simple shows the common controls; Advanced shows everything. */
export type UiMode = "simple" | "advanced";

export const uiModes: readonly UiMode[] = ["simple", "advanced"];

/** The keys of the stores a person fills by using the app. If any holds data, the person is not new. */
export const USED_APP_KEYS = [
  "designhub:colors",
  "designhub:typography",
  "designhub:brand",
  "designhub:effects",
  "designhub:backgrounds",
  "designhub:project",
] as const;

/** Where a first visit starts: Simple for someone new, Advanced for anyone who already used the app, so nothing moves on them. */
export function startingMode(hasExistingData: boolean): UiMode {
  return hasExistingData ? "advanced" : "simple";
}

/** A saved mode, or null for anything that is not one. */
export function cleanMode(value: unknown): UiMode | null {
  return value === "simple" || value === "advanced" ? value : null;
}
