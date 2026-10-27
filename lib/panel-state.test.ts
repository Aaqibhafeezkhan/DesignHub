import { describe, expect, test } from "vitest";

import { cleanPanelState, isPanelId, isPanelOpen } from "@/lib/panel-state";

describe("collapsible panels", () => {
  test("a panel that cannot fold is always open", () => {
    expect(isPanelOpen(false, false, false)).toBe(true);
    expect(isPanelOpen(false, undefined, false)).toBe(true);
  });

  test("a foldable panel uses its default until the person chooses, then what they chose", () => {
    expect(isPanelOpen(true, undefined, true)).toBe(true);
    expect(isPanelOpen(true, undefined, false)).toBe(false);
    expect(isPanelOpen(true, false, true)).toBe(false);
    expect(isPanelOpen(true, true, false)).toBe(true);
  });

  test("ids are lower-case words with hyphens", () => {
    for (const ok of ["a", "typography-opentype", "a11y-focus", "x9"]) expect(isPanelId(ok), ok).toBe(true);
    for (const bad of ["", "Upper", "-lead", "has space", "a".repeat(80), 4, null])
      expect(isPanelId(bad), String(bad)).toBe(false);
  });

  test("saved state keeps only an id with a yes or no", () => {
    expect(cleanPanelState({ "a-b": true, c: false, Bad: true, d: "yes", e: 1 })).toEqual({ "a-b": true, c: false });
    for (const bad of [null, undefined, [], "x", 3]) expect(cleanPanelState(bad)).toEqual({});
  });

  test("the number of saved choices is capped", () => {
    const many = Object.fromEntries(Array.from({ length: 500 }, (_, i) => [`p${i}`, true]));
    expect(Object.keys(cleanPanelState(many))).toHaveLength(200);
  });
});
