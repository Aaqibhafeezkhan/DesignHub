/** What one autosave does, decided from the stored snapshot's key and the live one's (see `snapshotKey`). */
export type SavePlan = "skip" | "write" | "write-and-version";

/**
 * Nothing is written when nothing changed: a store that fires without a new value (a hydration, a selection
 * that was already selected) used to rewrite the whole project, bump its time and queue a folder write each time.
 * A changed snapshot is written, and the one it replaces is offered as a timed version.
 */
export function planSave(storedKey: string | undefined, liveKey: string): SavePlan {
  if (storedKey === undefined) return "skip";
  return storedKey === liveKey ? "skip" : "write-and-version";
}

export type SaveStats = {
  /** Saves asked for, by the timer, a tab being hidden or a project being opened. */
  requested: number;
  /** Saves that wrote the project. */
  written: number;
  /** Saves that found nothing to write. */
  skipped: number;
  /** Saves asked for while one was running, folded into one more run instead of overlapping it. */
  coalesced: number;
};

const stats: SaveStats = { requested: 0, written: 0, skipped: 0, coalesced: 0 };

/** Counts autosave work, so how often and how much the app writes can be read, not guessed. */
export function countSave(kind: keyof SaveStats): void {
  stats[kind] += 1;
}

export function saveStats(): SaveStats {
  return { ...stats };
}

export function resetSaveStats(): void {
  stats.requested = stats.written = stats.skipped = stats.coalesced = 0;
}
