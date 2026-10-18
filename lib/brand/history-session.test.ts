import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  getHistoryAvailability,
  RECORD_DELAY,
  redoBrand,
  startBrandHistory,
  undoBrand,
} from "@/lib/brand/history-session";
import { createProject, openProject, ready, restoreVersion, undoRestore } from "@/lib/projects/actions";
import { deleteProject, getProject } from "@/lib/projects/repository";
import { applySnapshot, captureSnapshot, defaultSnapshot } from "@/lib/projects/snapshot";
import { deleteVersions } from "@/lib/projects/versions";
import { fromHex, toHex } from "@/lib/color/color";
import { useBrandStore } from "@/store/brand-store";
import { useColorStore } from "@/store/color-store";
import { useProjectStore } from "@/store/project-store";

const colors = () => useColorStore.getState();
const current = () => colors().swatches.map((swatch) => toHex(swatch.color));
const edit = (hex: string) => colors().generate(colors().swatches.map(() => fromHex(hex)));
const settle = () => vi.advanceTimersByTimeAsync(RECORD_DELAY);

function snapshot(hex: string, name = "History test") {
  const value = defaultSnapshot(name);
  value.colors.swatches = [
    { id: "first", color: fromHex(hex), locked: false },
    { id: "second", color: fromHex(hex), locked: false },
  ];
  return value;
}

describe("brand and palette history integration", () => {
  let stop: () => void;
  const projectIds: string[] = [];

  beforeEach(async () => {
    // Node uses the real storage adapter's memory fallback, never browser designs.
    await ready();
    useProjectStore.getState().setActive(null);
    applySnapshot(snapshot("#111111"));
    vi.useFakeTimers();
    stop = startBrandHistory();
    await vi.advanceTimersByTimeAsync(0);
  });

  afterEach(async () => {
    stop();
    vi.clearAllTimers();
    vi.useRealTimers();
    useProjectStore.getState().setActive(null);
    applySnapshot(defaultSnapshot());
    for (const id of projectIds.splice(0)) {
      await deleteProject(id);
      await deleteVersions(id);
    }
  });

  async function twoEdits() {
    edit("#222222");
    await settle();
    edit("#333333");
    await settle();
  }

  async function project(hex: string, name: string, open = false) {
    const value = await createProject(snapshot(hex, name), { open });
    projectIds.push(value.id);
    return value;
  }

  test("initial hydration has no undo or redo steps", () => {
    expect(getHistoryAvailability()).toEqual({ canUndo: false, canRedo: false });
    expect(undoBrand()).toBe(false);
    expect(redoBrand()).toBe(false);
    colors().undo();
    colors().redo();
    expect(current()).toEqual(["#111111", "#111111"]);
  });

  test("global undo leaves local undo and redo at the restored palette", async () => {
    await twoEdits();
    const retained = colors().past;
    const before = structuredClone(retained);
    expect(undoBrand()).toBe(true);
    expect(current()).toEqual(["#222222", "#222222"]);
    expect(colors().past).toHaveLength(1);
    expect(colors().future).toHaveLength(1);
    colors().undo();
    expect(current()).toEqual(["#111111", "#111111"]);
    colors().redo();
    expect(current()).toEqual(["#222222", "#222222"]);
    colors().redo();
    expect(current()).toEqual(["#333333", "#333333"]);
    expect(retained).toEqual(before);
  });

  test("global redo leaves local undo and redo usable", async () => {
    await twoEdits();
    undoBrand();
    expect(redoBrand()).toBe(true);
    expect(current()).toEqual(["#333333", "#333333"]);
    expect(colors().past).toHaveLength(2);
    colors().undo();
    expect(current()).toEqual(["#222222", "#222222"]);
    colors().redo();
    expect(current()).toEqual(["#333333", "#333333"]);
  });

  test("global restores can move into an existing local redo stack", async () => {
    await twoEdits();
    colors().undo();
    await settle();
    expect(colors().future).toHaveLength(1);
    expect(undoBrand()).toBe(true);
    expect(current()).toEqual(["#333333", "#333333"]);
    expect(colors().future).toEqual([]);
    colors().undo();
    expect(current()).toEqual(["#222222", "#222222"]);
    colors().redo();
    expect(current()).toEqual(["#333333", "#333333"]);
  });

  test("non-palette global restores keep local stacks and are not recorded as edits", async () => {
    await twoEdits();
    useBrandStore.getState().updateProfile({ name: "Renamed" });
    await settle();
    const past = colors().past;
    expect(undoBrand()).toBe(true);
    expect(colors().past).toBe(past);
    await settle();
    expect(redoBrand()).toBe(true);
    expect(useBrandStore.getState().profile.name).toBe("Renamed");
    expect(redoBrand()).toBe(false);
    colors().undo();
    expect(current()).toEqual(["#222222", "#222222"]);
    colors().redo();
    expect(current()).toEqual(["#333333", "#333333"]);
  });

  test("a global palette absent from local history keeps earlier and later local steps", async () => {
    edit("#222222");
    await settle();
    colors().updateColor("first", fromHex("#444444"));
    await settle();
    edit("#333333");
    await settle();
    undoBrand();
    undoBrand();
    expect(current()).toEqual(["#222222", "#222222"]);
    colors().undo();
    expect(current()).toEqual(["#111111", "#111111"]);
    colors().redo();
    expect(current()).toEqual(["#222222", "#222222"]);
    colors().redo();
    expect(current()).toEqual(["#333333", "#333333"]);
  });

  test("a new palette edit invalidates both redo branches", async () => {
    await twoEdits();
    undoBrand();
    edit("#444444");
    expect(colors().future).toEqual([]);
    await settle();
    expect(redoBrand()).toBe(false);
    colors().redo();
    expect(current()).toEqual(["#444444", "#444444"]);
  });

  test("the retained palette history stays bounded", async () => {
    for (let n = 1; n <= 60; n += 1) {
      edit(`#${n.toString(16).padStart(6, "0")}`);
      await settle();
    }
    expect(colors().past).toHaveLength(50);
    undoBrand();
    expect(current()).toEqual(["#00003b", "#00003b"]);
    expect(colors().past).toHaveLength(49);
    colors().undo();
    expect(current()).toEqual(["#00003a", "#00003a"]);
    colors().redo();
    colors().redo();
    expect(current()).toEqual(["#00003c", "#00003c"]);
    expect(colors().past).toHaveLength(50);
  });

  test.each([false, true])("opening another project clears both histories (pending edit: %s)", async (pending) => {
    const first = await project("#111111", "First", true);
    const second = await project("#aaaaaa", "Second");
    await twoEdits();
    colors().undo();
    if (!pending) await settle();
    expect(colors().past.length).toBeGreaterThan(0);
    expect(colors().future.length).toBeGreaterThan(0);

    await openProject(second.id);
    expect(useProjectStore.getState().activeId).toBe(second.id);
    expect(colors().past).toEqual([]);
    expect(colors().future).toEqual([]);
    expect(getHistoryAvailability()).toEqual({ canUndo: false, canRedo: false });
    expect(undoBrand()).toBe(false);
    expect(redoBrand()).toBe(false);
    colors().undo();
    colors().redo();
    expect(current()).toEqual(["#aaaaaa", "#aaaaaa"]);
    expect(undoBrand()).toBe(false);

    // The first edit in the newly opened project can be undone immediately.
    edit("#bbbbbb");
    expect(undoBrand()).toBe(true);
    expect(current()).toEqual(["#aaaaaa", "#aaaaaa"]);
    await settle();
    expect(undoBrand()).toBe(false);
    expect((await getProject(first.id))?.snapshot.colors.swatches).toEqual(snapshot("#222222").colors.swatches);
    await openProject(first.id);
    expect(current()).toEqual(["#222222", "#222222"]);
    expect(colors().past).toEqual([]);
    expect(colors().future).toEqual([]);
    expect(undoBrand()).toBe(false);
    expect(redoBrand()).toBe(false);
  });

  test("reopening the active project preserves both histories", async () => {
    const value = await project("#111111", "First", true);
    await twoEdits();
    const past = colors().past;
    await openProject(value.id);
    expect(colors().past).toBe(past);
    expect(undoBrand()).toBe(true);
    expect(current()).toEqual(["#222222", "#222222"]);
  });

  test("version restore and its undo still reset local color history", async () => {
    const value = await project("#111111", "First", true);
    await twoEdits();
    const previous = await restoreVersion(value.id, {
      id: "test-version",
      projectId: value.id,
      createdAt: 1,
      reason: "restore",
      snapshot: snapshot("#aaaaaa", "First"),
    });
    expect(current()).toEqual(["#aaaaaa", "#aaaaaa"]);
    expect(colors().past).toEqual([]);
    expect(colors().future).toEqual([]);
    edit("#bbbbbb");
    expect(previous).not.toBeNull();
    if (previous) await undoRestore(value.id, previous);
    expect(current()).toEqual(["#333333", "#333333"]);
    expect(colors().past).toEqual([]);
    expect(colors().future).toEqual([]);
  });

  test("default snapshot restores reset history and copy the supplied palette", async () => {
    await twoEdits();
    colors().undo();
    const value = captureSnapshot();
    applySnapshot(value);
    expect(colors().past).toEqual([]);
    expect(colors().future).toEqual([]);
    colors().updateColor("first", fromHex("#aaaaaa"));
    expect(value.colors.swatches).toEqual(snapshot("#222222").colors.swatches);
  });
});
