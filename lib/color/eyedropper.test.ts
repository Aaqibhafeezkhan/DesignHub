import { describe, expect, test } from "vitest";

import { toHex } from "@/lib/color/color";
import { fromEyeDropperResult } from "@/lib/color/eyedropper";

describe("fromEyeDropperResult", () => {
  test("converts the picked sRGB hex color to the app's color format", () => {
    expect(toHex(fromEyeDropperResult({ sRGBHex: "#6366f1" }))).toBe("#6366f1");
  });
});
