import { describe, expect, test } from "vitest";

import { familyWeightRows, listFamilyWeights, nearestWeight } from "@/lib/typography/compare";
import type { FontFamily } from "@/types/typography";

const staticFamily: FontFamily = {
  family: "Source Sans 3",
  category: "sans-serif",
  weights: [400, 600, 700],
  italic: true,
  rank: 40,
};

const variableFamily: FontFamily = {
  family: "Inter",
  category: "sans-serif",
  weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
  italic: true,
  axes: [
    { tag: "wght", min: 100, max: 900, default: 400 },
    { tag: "opsz", min: 14, max: 32, default: 14 },
  ],
  rank: 4,
};

const variableNamedOnly: FontFamily = {
  family: "Open Sans",
  category: "sans-serif",
  weights: [],
  italic: true,
  axes: [{ tag: "wght", min: 300, max: 800, default: 400 }],
  rank: 2,
};

describe("familyWeightRows", () => {
  test("lists only the static faces a family ships", () => {
    expect(listFamilyWeights(staticFamily)).toEqual([400, 600, 700]);
    expect(familyWeightRows(staticFamily)).toEqual([
      { weight: 400, name: "Regular" },
      { weight: 600, name: "Semibold" },
      { weight: 700, name: "Bold" },
    ]);
  });

  test("lists the named instances of a variable family", () => {
    expect(listFamilyWeights(variableFamily)).toEqual([100, 200, 300, 400, 500, 600, 700, 800, 900]);
    expect(familyWeightRows(variableFamily).map((row) => row.name)).toEqual([
      "Thin",
      "Extra light",
      "Light",
      "Regular",
      "Medium",
      "Semibold",
      "Bold",
      "Extra bold",
      "Black",
    ]);
  });

  test("fills standard named instances from the wght axis when weights are empty", () => {
    expect(listFamilyWeights(variableNamedOnly)).toEqual([300, 400, 500, 600, 700, 800]);
    expect(familyWeightRows(variableNamedOnly)[0]).toEqual({ weight: 300, name: "Light" });
  });

  test("falls back to Regular when the family is missing", () => {
    expect(familyWeightRows(undefined)).toEqual([{ weight: 400, name: "Regular" }]);
  });
});

describe("nearestWeight", () => {
  test("clamps to the wght axis on a variable family", () => {
    expect(nearestWeight(variableFamily, 50)).toBe(100);
    expect(nearestWeight(variableFamily, 950)).toBe(900);
    expect(nearestWeight(variableFamily, 450)).toBe(450);
  });

  test("picks the closest static face", () => {
    expect(nearestWeight(staticFamily, 500)).toBe(400);
    expect(nearestWeight(staticFamily, 650)).toBe(600);
  });
});
