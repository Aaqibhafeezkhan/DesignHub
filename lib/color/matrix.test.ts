import { describe, expect, test } from "vitest";

import { apcaContrast, fromHex } from "@/lib/color/color";
import { apcaLevel, matrixCell } from "@/lib/color/matrix";

const white = fromHex("#ffffff");
const black = fromHex("#000000");
const indigo = fromHex("#6366f1");

describe("apcaLevel", () => {
  test("maps |Lc| onto the Bronze levels, in either polarity", () => {
    expect(apcaLevel(90)).toBe("body");
    expect(apcaLevel(-75)).toBe("body");
    expect(apcaLevel(60)).toBe("content");
    expect(apcaLevel(-45)).toBe("headline");
    expect(apcaLevel(30)).toBe("nonText");
    expect(apcaLevel(29.9)).toBe("fail");
  });
});

describe("matrixCell", () => {
  test("WCAG cells show the ratio and rating", () => {
    expect(matrixCell(black, white, "wcag")).toMatchObject({ value: "21.0", level: "AAA" });
    expect(matrixCell(white, white, "wcag")).toMatchObject({ value: "1.0", level: "Fail" });
  });

  test("APCA cells are signed: positive for dark on light, negative for light on dark", () => {
    const dark = matrixCell(black, white, "apca");
    const light = matrixCell(white, black, "apca");
    expect(dark.mode === "apca" && dark.lc).toBeGreaterThan(100);
    expect(dark.value.startsWith("+")).toBe(true);
    expect(light.mode === "apca" && light.lc).toBeLessThan(-100);
    expect(light.value.startsWith("-")).toBe(true);
    expect(dark.level).toBe("body");
    expect(light.level).toBe("body");
  });

  test("a mid pair gets the level its rounded Lc reaches and matches apcaContrast", () => {
    const cell = matrixCell(indigo, white, "apca");
    if (cell.mode !== "apca") throw new Error("expected an APCA cell");
    expect(cell.lc).toBe(Math.round(apcaContrast(indigo, white)));
    expect(cell.level).toBe(apcaLevel(cell.lc));
    expect(matrixCell(white, white, "apca")).toMatchObject({ value: "0", level: "fail" });
  });

  test("a small palette gives a full matrix of cells", () => {
    const palette = [white, indigo, black];
    const cells = palette.flatMap((text) => palette.map((bg) => matrixCell(text, bg, "apca").value));
    expect(cells).toHaveLength(9);
    cells.forEach((value) => expect(value).toMatch(/^[+-]?\d+$/));
  });
});
