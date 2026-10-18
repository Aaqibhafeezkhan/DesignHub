import {
  canRedo,
  canUndo,
  createHistory,
  record,
  redo as stepForward,
  undo as stepBack,
  type History,
} from "@/lib/brand/history";
import {
  applySnapshot,
  captureSnapshot,
  subscribeToSnapshot,
  whenSnapshotStoresHydrated,
  type BrandSnapshot,
} from "@/lib/projects/snapshot";
import { useProjectStore } from "@/store/project-store";

/**
 * The live undo and redo history for brand edits across every studio. One session per page load:
 * it watches the brand-defining stores, records a snapshot after a pause in editing and restores
 * snapshots on undo and redo. The stack itself is the pure `lib/brand/history`.
 */

/** Quiet time after the last edit before a snapshot is recorded, so typing and slider drags are one step. */
export const RECORD_DELAY = 600;

export type HistoryAvailability = { canUndo: boolean; canRedo: boolean };

const sameSnapshot = (a: BrandSnapshot, b: BrandSnapshot) => JSON.stringify(a) === JSON.stringify(b);

let history: History<BrandSnapshot> | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
/** True while undo or redo writes into the stores, so those writes are never recorded as edits. */
let applying = false;
/** The next recorded snapshot becomes the starting point (after a project switch or the first load). */
let rebase = true;
let stop: (() => void) | null = null;
let availability: HistoryAvailability = { canUndo: false, canRedo: false };
const listeners = new Set<() => void>();

function publish() {
  const next = { canUndo: history ? canUndo(history) : false, canRedo: history ? canRedo(history) : false };
  if (next.canUndo === availability.canUndo && next.canRedo === availability.canRedo) return;
  availability = next;
  listeners.forEach((listener) => listener());
}

/** Records the current stores as a step (or as the new starting point). Called after a pause in editing. */
function flush() {
  clearTimeout(timer);
  timer = undefined;
  const current = captureSnapshot();
  if (rebase || !history) {
    history = createHistory(current);
    rebase = false;
  } else {
    history = record(history, current, sameSnapshot);
  }
  publish();
}

function schedule() {
  if (applying) return;
  clearTimeout(timer);
  timer = setTimeout(flush, RECORD_DELAY);
}

/** Starts watching. Safe to call more than once; returns a function that stops. */
export function startBrandHistory(): () => void {
  if (stop) return stop;
  let cancelled = false;
  let offStores: (() => void) | null = null;
  let offProject: (() => void) | null = null;

  void whenSnapshotStoresHydrated().then(() => {
    if (cancelled) return;
    rebase = true;
    flush();
    offStores = subscribeToSnapshot(schedule);
    // Opening another project replaces every store: that is a new starting point, not an edit.
    let activeId = useProjectStore.getState().activeId;
    offProject = useProjectStore.subscribe((state) => {
      if (state.activeId === activeId) return;
      activeId = state.activeId;
      rebase = true;
      schedule();
    });
  });

  stop = () => {
    cancelled = true;
    offStores?.();
    offProject?.();
    clearTimeout(timer);
    timer = undefined;
    stop = null;
    history = null;
    rebase = true;
    publish();
  };
  return stop;
}

/** Establishes the just-opened project's baseline before its first edit can be recorded. */
export function resetBrandHistory(): void {
  if (!history) return;
  rebase = true;
  flush();
}

function step(move: (current: History<BrandSnapshot>) => History<BrandSnapshot>): boolean {
  if (!history) return false;
  // An edit still waiting for its pause counts as a step, so undo takes it back first.
  if (timer !== undefined) flush();
  const current = history;
  const next = move(current);
  if (next === current) return false;
  applying = true;
  try {
    applySnapshot(next.present, { preserveColorHistory: true });
  } finally {
    applying = false;
  }
  // Read the stores back, so defaults merged in by applySnapshot never look like a new edit.
  history = { ...next, present: captureSnapshot() };
  publish();
  return true;
}

/** Restores the previous brand state. Returns false when there is nothing to undo. */
export const undoBrand = () => step(stepBack);

/** Restores the state undo stepped over. Returns false when there is nothing to redo. */
export const redoBrand = () => step(stepForward);

export function subscribeHistory(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const getHistoryAvailability = (): HistoryAvailability => availability;
