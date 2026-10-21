import { describe, expect, test } from "vitest";

import {
  clippedBoxes,
  paragraphSpacingPx,
  TEXT_SPACING,
  textSpacingSection,
  textSpacingStatus,
  withTextSpacing,
  type BoxMetrics,
} from "@/lib/a11y/text-spacing";
import type { A11yTypography } from "@/types/a11y";

const typography = (patch: Partial<A11yTypography> = {}): A11yTypography => ({
  family: "Inter",
  size: 16,
  lineHeight: 1.2,
  letterSpacing: 0,
  wordSpacing: 0,
  weight: 400,
  measure: 640,
  ...patch,
});

const box = (patch: Partial<BoxMetrics> = {}): BoxMetrics => ({
  id: "a",
  scrollWidth: 100,
  clientWidth: 100,
  scrollHeight: 40,
  clientHeight: 40,
  overflowX: "visible",
  overflowY: "visible",
  ...patch,
});

describe("WCAG 1.4.12 values", () => {
  test("are 1.5 line height, 2x paragraph, 0.12em letter and 0.16em word spacing", () => {
    expect(TEXT_SPACING).toEqual({ lineHeight: 1.5, paragraphSpacing: 2, letterSpacing: 0.12, wordSpacing: 0.16 });
    expect(paragraphSpacingPx(18)).toBe(36);
  });

  test("withTextSpacing raises each value to the minimum and never lowers one", () => {
    expect(withTextSpacing(typography())).toMatchObject({ lineHeight: 1.5, letterSpacing: 0.12, wordSpacing: 0.16 });
    const roomy = withTextSpacing(typography({ lineHeight: 1.8, letterSpacing: 0.2, wordSpacing: 0.3 }));
    expect(roomy).toMatchObject({ lineHeight: 1.8, letterSpacing: 0.2, wordSpacing: 0.3 });
    expect(withTextSpacing(typography()).size).toBe(16);
  });
});

describe("textSpacingSection", () => {
  test("marks which current values already meet the minimums", () => {
    const rows = textSpacingSection(typography({ lineHeight: 1.6, letterSpacing: 0.05, wordSpacing: 0.16 })).checks;
    expect(rows.map((row) => [row.check, row.pass])).toEqual([
      ["Line height", true],
      ["Letter spacing", false],
      ["Word spacing", true],
    ]);
    expect(rows[1]).toMatchObject({ required: "0.12em", current: "0.05em" });
  });
});

describe("clipped text", () => {
  test("only boxes that hide their overflow and overflow are reported", () => {
    const boxes = [
      box({ id: "fits", overflowX: "hidden", overflowY: "hidden" }),
      box({ id: "wide", overflowX: "hidden", scrollWidth: 140 }),
      box({ id: "tall", overflowY: "clip", scrollHeight: 90 }),
      box({ id: "visible", scrollWidth: 300, scrollHeight: 300 }),
      box({ id: "scroll", overflowY: "auto", scrollHeight: 300 }),
      box({ id: "rounding", overflowX: "hidden", scrollWidth: 101 }),
    ];
    expect(clippedBoxes(boxes)).toEqual(["wide", "tall"]);
  });

  test("the status says off, unknown, fits or clipped", () => {
    expect(textSpacingStatus(false, [box()])).toEqual({ kind: "off" });
    expect(textSpacingStatus(true, [])).toEqual({ kind: "unknown" });
    expect(textSpacingStatus(true, [box(), box({ id: "b" })])).toEqual({ kind: "fits", checked: 2 });
    expect(textSpacingStatus(true, [box({ id: "x", overflowY: "hidden", scrollHeight: 80 })])).toEqual({
      kind: "clipped",
      ids: ["x"],
    });
  });
});
