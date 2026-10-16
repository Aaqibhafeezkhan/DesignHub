/**
 * A linear undo and redo stack. Pure and generic: it only holds values and decides which one is
 * current, so the caller decides what a value is (here, a brand snapshot) and how to restore it.
 */

/** How many earlier states a history keeps. */
export const HISTORY_LIMIT = 50;

export type History<T> = {
  /** Earlier states, oldest first. */
  past: readonly T[];
  /** The state the app is showing. */
  present: T;
  /** States that undo stepped over, next redo first. */
  future: readonly T[];
};

export function createHistory<T>(present: T): History<T> {
  return { past: [], present, future: [] };
}

/**
 * Records a new current state. A state equal to the present one changes nothing. Otherwise the
 * present moves to the past (dropping the oldest beyond `limit`) and the redo stack is cleared.
 */
export function record<T>(
  history: History<T>,
  next: T,
  equals: (a: T, b: T) => boolean = Object.is,
  limit: number = HISTORY_LIMIT,
): History<T> {
  if (equals(history.present, next)) return history;
  return { past: [...history.past, history.present].slice(-limit), present: next, future: [] };
}

export const canUndo = <T>(history: History<T>): boolean => history.past.length > 0;
export const canRedo = <T>(history: History<T>): boolean => history.future.length > 0;

/** Steps back one state. Returns the same history when there is nothing to undo. */
export function undo<T>(history: History<T>): History<T> {
  if (!canUndo(history)) return history;
  return {
    past: history.past.slice(0, -1),
    present: history.past[history.past.length - 1] as T,
    future: [history.present, ...history.future],
  };
}

/** Steps forward one state. Returns the same history when there is nothing to redo. */
export function redo<T>(history: History<T>): History<T> {
  if (!canRedo(history)) return history;
  return { past: [...history.past, history.present], present: history.future[0] as T, future: history.future.slice(1) };
}
