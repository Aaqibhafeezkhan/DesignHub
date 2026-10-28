import { beforeEach, describe, expect, test } from "vitest";

import { snapshotKey } from "@/lib/projects/history";
import { countSave, planSave, resetSaveStats, saveStats } from "@/lib/projects/save-plan";
import { defaultSnapshot } from "@/lib/projects/snapshot";

describe("planSave", () => {
  test("an unchanged snapshot writes nothing, whatever order its keys were built in", () => {
    const a = defaultSnapshot("Acme");
    const reverse = (value: unknown): unknown =>
      Array.isArray(value)
        ? value.map(reverse)
        : value && typeof value === "object"
          ? Object.fromEntries(
              Object.entries(value)
                .reverse()
                .map(([key, item]) => [key, reverse(item)]),
            )
          : value;
    const reordered = reverse(a);
    expect(Object.keys(reordered as object)).not.toEqual(Object.keys(a));
    expect(planSave(snapshotKey(a), snapshotKey(reordered))).toBe("skip");
  });

  test("a changed snapshot is written and the old one is offered as a version", () => {
    expect(planSave(snapshotKey(defaultSnapshot("Acme")), snapshotKey(defaultSnapshot("Other")))).toBe(
      "write-and-version",
    );
  });

  test("a project that is not stored is never created by an autosave", () => {
    expect(planSave(undefined, snapshotKey(defaultSnapshot("Acme")))).toBe("skip");
  });
});

describe("save counters", () => {
  beforeEach(resetSaveStats);

  test("count each kind and reset together", () => {
    countSave("requested");
    countSave("requested");
    countSave("written");
    countSave("coalesced");
    expect(saveStats()).toEqual({ requested: 2, written: 1, skipped: 0, coalesced: 1 });
    resetSaveStats();
    expect(saveStats()).toEqual({ requested: 0, written: 0, skipped: 0, coalesced: 0 });
  });
});
