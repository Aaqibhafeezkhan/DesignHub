import { studios } from "@/lib/navigation";

/** How many recent choices the command palette shows when nothing is typed. */
export const MAX_RECENT_COMMANDS = 5;

/** The actions that can be remembered, besides opening a studio. */
export const RECENT_ACTIONS = ["theme", "shortcuts", "newProject"] as const;
export type RecentAction = (typeof RECENT_ACTIONS)[number];

/** `studio:<id>` for a studio, `action:<name>` for an action. */
export type RecentCommandId = `studio:${string}` | `action:${RecentAction}`;

/** True for an id the palette can still run: a studio that exists or a known action. */
export function isRecentCommand(value: unknown): value is RecentCommandId {
  if (typeof value !== "string") return false;
  if (value.startsWith("studio:")) return studios.some((studio) => studio.id === value.slice(7));
  if (value.startsWith("action:")) return (RECENT_ACTIONS as readonly string[]).includes(value.slice(7));
  return false;
}

/** The newest choice first, with no repeats, at most `MAX_RECENT_COMMANDS`, and no id that no longer exists. */
export function pushRecentCommand(list: readonly string[], id: RecentCommandId): RecentCommandId[] {
  return [id, ...list.filter((item) => item !== id)].filter(isRecentCommand).slice(0, MAX_RECENT_COMMANDS);
}

/** Saved choices cleaned up: stale ids from a removed studio are dropped, and the list is capped. */
export function cleanRecentCommands(list: unknown): RecentCommandId[] {
  return Array.isArray(list) ? list.filter(isRecentCommand).slice(0, MAX_RECENT_COMMANDS) : [];
}
