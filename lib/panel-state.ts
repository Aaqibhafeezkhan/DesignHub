/** The ids a panel can be remembered by: lower-case words joined with hyphens. */
const PANEL_ID = /^[a-z0-9][a-z0-9-]{0,60}$/;

export function isPanelId(value: unknown): value is string {
  return typeof value === "string" && PANEL_ID.test(value);
}

/**
 * Whether a panel is open: what the person chose when they chose, and the panel's own default until then.
 * A panel that cannot fold is always open.
 */
export function isPanelOpen(collapsible: boolean, chosen: boolean | undefined, defaultOpen: boolean): boolean {
  if (!collapsible) return true;
  return chosen ?? defaultOpen;
}

/** Saved choices with anything that is not an id and a yes or no dropped, and a cap on how many are kept. */
export function cleanPanelState(value: unknown, max = 200): Record<string, boolean> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  const entries = Object.entries(value).filter(
    (entry): entry is [string, boolean] => isPanelId(entry[0]) && typeof entry[1] === "boolean",
  );
  return Object.fromEntries(entries.slice(0, max));
}
