import { describe, expect, test } from "vitest";

import { clearOfflineCaches, isOfflineCache, measureRows, quotaShare } from "@/lib/storage-report";

describe("storage report", () => {
  test("only the static and runtime caches are offline caches", () => {
    expect(isOfflineCache("designhub-static-abc")).toBe(true);
    expect(isOfflineCache("designhub-runtime-abc")).toBe(true);
    expect(isOfflineCache("designhub-share")).toBe(false);
    expect(isOfflineCache("other-static-abc")).toBe(false);
  });

  test("rows are counted and measured as JSON", () => {
    expect(measureRows([])).toEqual({ count: 0, bytes: 0 });
    expect(measureRows([{ a: 1 }, { a: 22 }])).toEqual({ count: 2, bytes: `{"a":1}`.length + `{"a":22}`.length });
  });

  test("the quota share is a whole percent, and unknown when a number is missing", () => {
    expect(quotaShare(50, 200)).toBe(25);
    expect(quotaShare(1, 1000)).toBe(0);
    expect(quotaShare(undefined, 1000)).toBeNull();
    expect(quotaShare(10, 0)).toBeNull();
    expect(quotaShare(500, 100)).toBe(100);
  });

  test("clearing deletes the offline caches and leaves the share cache and others alone", async () => {
    const names = new Set(["designhub-static-1", "designhub-runtime-1", "designhub-share", "unrelated"]);
    const deleted = await clearOfflineCaches({
      keys: async () => [...names],
      delete: async (name) => names.delete(name),
    });
    expect(deleted).toBe(2);
    expect([...names].sort()).toEqual(["designhub-share", "unrelated"]);
  });
});
