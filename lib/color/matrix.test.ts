import { describe, expect, test, vi } from "vitest";

import type * as ColorModule from "@/lib/color/color";
import { apcaContrast, fromHex } from "@/lib/color/color";
import { apcaLevel, matrixCell } from "@/lib/color/matrix";

// Pass through to the real implementation, but let a test pin an exact Lc for one call.
vi.mock("@/lib/color/color", async (importOriginal) => {
  const actual = await importOriginal<typeof ColorModule>();
  return { ...actual, apcaContrast: vi.fn(actual.apcaContrast) };
});

const white = fromHex("#ffffff");
const black = fromHex("#000000");
const indigo = fromHex("#6366f1");
const transparent = { ...fromHex("#ffffff"), alpha: 0 };

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

describe("apcaLevel boundaries", () => {
  test.each([
    [75, "body"],
    [74.99, "content"],
    [60, "content"],
    [59.99, "headline"],
    [45, "headline"],
    [44.99, "nonText"],
    [30, "nonText"],
    [29.99, "fail"],
    [0, "fail"],
  ] as const)("Lc %s is %s", (lc, level) => {
    expect(apcaLevel(lc)).toBe(level);
    expect(apcaLevel(-lc)).toBe(level);
  });
});

describe("matrixCell edge cases", () => {
  test("identical colors give Lc 0 and fail, in either polarity", () => {
    expect(matrixCell(indigo, indigo, "apca")).toMatchObject({ value: "0", level: "fail" });
    expect(matrixCell(black, black, "apca")).toMatchObject({ value: "0", level: "fail" });
  });

  test("very dark text on a very dark background fails", () => {
    const nearBlack = fromHex("#0a0a0a");
    expect(matrixCell(black, nearBlack, "apca").level).toBe("fail");
    expect(matrixCell(nearBlack, black, "apca").level).toBe("fail");
  });

  test("transparent colors still produce a finite cell in both modes", () => {
    for (const mode of ["wcag", "apca"] as const) {
      for (const [text, bg] of [
        [transparent, white],
        [white, transparent],
        [transparent, transparent],
      ]) {
        const cell = matrixCell(text, bg, mode);
        expect(cell.value).not.toContain("NaN");
        expect(cell.value).not.toContain("Infinity");
      }
    }
  });

  test.each([
    [75.4, "75", "body"],
    [74.6, "75", "body"],
    [74.4, "74", "content"],
    [60.4, "60", "content"],
    [59.6, "60", "content"],
    [59.4, "59", "headline"],
    [44.6, "45", "headline"],
    [44.4, "44", "nonText"],
    [29.6, "30", "nonText"],
    [29.4, "29", "fail"],
  ] as const)("Lc %s rounds to +%s and reaches %s", async (lc, shown, level) => {
    const { apcaContrast: mocked } = await import("@/lib/color/color");
    vi.mocked(mocked).mockReturnValueOnce(lc);
    expect(matrixCell(indigo, white, "apca")).toMatchObject({ value: `+${shown}`, level });
    vi.mocked(mocked).mockReturnValueOnce(-lc);
    expect(matrixCell(white, indigo, "apca")).toMatchObject({ value: `-${shown}`, level });
  });
});
