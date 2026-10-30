import { describe, expect, test } from "vitest";

import { deletable, pruned, toggled, toggledAll } from "@/lib/projects/selection";

describe("project selection", () => {
  test("toggling adds an id, then takes it out, and never changes the set it was given", () => {
    const empty = new Set<string>();
    const one = toggled(empty, "a");
    expect([...one]).toEqual(["a"]);
    expect(empty.size).toBe(0);
    expect(toggled(one, "a").size).toBe(0);
  });

  test("select all picks what is shown, and a second time clears it", () => {
    const shown = ["a", "b", "c"];
    const all = toggledAll(new Set(["a"]), shown);
    expect([...all].sort()).toEqual(shown);
    expect(toggledAll(all, shown).size).toBe(0);
    expect(toggledAll(new Set(), []).size).toBe(0);
  });

  test("an id that no longer exists leaves the selection", () => {
    expect([...pruned(new Set(["a", "gone"]), ["a", "b"])]).toEqual(["a"]);
  });

  test("a bulk delete keeps the open project and says so", () => {
    expect(deletable(new Set(["a", "open", "c"]), "open")).toEqual({ ids: ["a", "c"], keptOpen: true });
    expect(deletable(new Set(["a"]), "open")).toEqual({ ids: ["a"], keptOpen: false });
    expect(deletable(new Set(["a"]), null)).toEqual({ ids: ["a"], keptOpen: false });
  });
});
