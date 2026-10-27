import { describe, expect, test } from "vitest";

import { filterGroups, matchesQuery } from "@/lib/picker-search";

const item = { id: "card-tilt", label: "Card tilt", description: "A perspective hover tilt", keywords: "3d" };

describe("picker search", () => {
  test("an empty query matches everything", () => {
    expect(matchesQuery(item, "")).toBe(true);
    expect(matchesQuery(item, "   ")).toBe(true);
  });

  test("matches the label, id, description and keywords, ignoring case", () => {
    for (const query of ["card", "TILT", "card-tilt", "perspective", "3d"])
      expect(matchesQuery(item, query), query).toBe(true);
    expect(matchesQuery(item, "glass")).toBe(false);
  });

  test("every word must match, in any order", () => {
    expect(matchesQuery(item, "tilt card")).toBe(true);
    expect(matchesQuery(item, "card glass")).toBe(false);
  });

  test("the group's name counts, so a group can be found by its name", () => {
    expect(matchesQuery(item, "motion", "Motion")).toBe(true);
    expect(matchesQuery(item, "motion", "Surfaces")).toBe(false);
  });

  test("filterGroups keeps order and drops groups with no match", () => {
    const groups = [
      {
        id: "a",
        label: "Surfaces",
        items: [
          { id: "glass", label: "Glass" },
          { id: "glow", label: "Glow" },
        ],
      },
      { id: "b", label: "Motion", items: [{ id: "card-tilt", label: "Card tilt" }] },
    ];
    expect(filterGroups(groups, "gl").map((group) => group.items.map((entry) => entry.id))).toEqual([
      ["glass", "glow"],
    ]);
    expect(filterGroups(groups, "tilt").map((group) => group.id)).toEqual(["b"]);
    expect(filterGroups(groups, "motion").map((group) => group.id)).toEqual(["b"]);
    expect(filterGroups(groups, "zzz")).toEqual([]);
    expect(filterGroups(groups, "")).toEqual(groups);
  });
});
