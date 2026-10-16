import { describe, expect, test } from "vitest";

import { HISTORY_LIMIT, canRedo, canUndo, createHistory, record, redo, undo } from "@/lib/brand/history";

/** Records each value in turn, like a series of edits. */
const edits = (...values: number[]) => values.reduce((history, value) => record(history, value), createHistory(0));

describe("record", () => {
  test("moves the present to the past", () => {
    const history = edits(1, 2);
    expect(history).toEqual({ past: [0, 1], present: 2, future: [] });
  });

  test("an unchanged state is not a new step", () => {
    const history = edits(1);
    expect(record(history, 1)).toBe(history);
  });

  test("uses the given comparison", () => {
    const history = createHistory({ a: 1 });
    const same = record(history, { a: 1 }, (x, y) => x.a === y.a);
    expect(same).toBe(history);
  });

  test("keeps at most the limit of earlier states, dropping the oldest", () => {
    const history = edits(...Array.from({ length: HISTORY_LIMIT + 10 }, (_, i) => i + 1));
    expect(history.past).toHaveLength(HISTORY_LIMIT);
    expect(history.past[0]).toBe(10);
    expect(history.present).toBe(HISTORY_LIMIT + 10);
  });

  test("a smaller limit is respected", () => {
    const history = [1, 2, 3, 4].reduce((h, value) => record(h, value, Object.is, 2), createHistory(0));
    expect(history.past).toEqual([2, 3]);
  });

  test("a new edit clears the redo stack", () => {
    const stepped = undo(undo(edits(1, 2, 3)));
    expect(canRedo(stepped)).toBe(true);
    const edited = record(stepped, 9);
    expect(edited.future).toEqual([]);
    expect(canRedo(edited)).toBe(false);
    expect(edited.past).toEqual([0, 1]);
  });
});

describe("undo and redo", () => {
  test("walk back and forward through every state", () => {
    let history = edits(1, 2, 3);
    const seen = [history.present];
    while (canUndo(history)) {
      history = undo(history);
      seen.push(history.present);
    }
    expect(seen).toEqual([3, 2, 1, 0]);
    while (canRedo(history)) {
      history = redo(history);
      seen.push(history.present);
    }
    expect(seen.slice(4)).toEqual([1, 2, 3]);
  });

  test("do nothing at the ends", () => {
    const fresh = createHistory(5);
    expect(undo(fresh)).toBe(fresh);
    expect(redo(fresh)).toBe(fresh);
    expect(canUndo(fresh)).toBe(false);
    expect(canRedo(fresh)).toBe(false);
  });

  test("can be undone past a falsy state", () => {
    const history = undo(edits(1));
    expect(history.present).toBe(0);
    expect(redo(history).present).toBe(1);
  });
});
