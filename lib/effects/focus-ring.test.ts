import { describe, expect, test } from "vitest";

import { focusIndicatorCheck } from "@/lib/a11y/contrast";
import { effectStylesheet } from "@/lib/effects/css";
import { effectDefaults } from "@/lib/effects/defaults";
import { focusRingCheck } from "@/lib/effects/focus-ring";
import { generateEffect } from "@/lib/effects/registry";
import type { FocusRingSettings } from "@/types/effects";

const defaults = effectDefaults["focus-ring"];
const ring = (patch: Partial<FocusRingSettings> = {}): FocusRingSettings => ({ ...defaults, ...patch });

describe("focus ring", () => {
  test("a dark ring on a light page and component passes", () => {
    const check = focusRingCheck(ring({ color: "#1d4ed8", background: "#ffffff", component: "#f4f4f5" }));
    expect(check.pass).toBe(true);
    expect(check.backgroundRatio).toBeGreaterThanOrEqual(3);
    expect(check.componentRatio).toBeGreaterThanOrEqual(3);
    expect(check.suggestion).toBeNull();
  });

  test("a pale ring fails and suggests a passing color", () => {
    const failing = ring({ color: "#93c5fd", background: "#ffffff", component: "#f4f4f5" });
    const check = focusRingCheck(failing);
    expect(check.pass).toBe(false);
    expect(check.backgroundRatio).toBeLessThan(3);
    expect(check.suggestion).not.toBeNull();
    expect(focusRingCheck({ ...failing, color: check.suggestion! }).pass).toBe(true);
  });

  test("matches the Accessibility Lab check for the same colors", () => {
    const s = ring({ color: "#6366f1", background: "#0b1020", component: "#1e293b" });
    expect(focusRingCheck(s)).toEqual(focusIndicatorCheck("#6366f1", "#0b1020", "#1e293b"));
  });

  test("draws an outer outline and an inner ring in the offset gap", () => {
    const effect = generateEffect("focus-ring", ring({ width: 3, offset: 2, color: "#4f46e5", inner: "#ffffff" }))!;
    const css = effectStylesheet(effect, ".fx-focus-ring");
    expect(css).toContain("outline: 3px solid #4f46e5;");
    expect(css).toContain("outline-offset: 2px;");
    expect(css).toContain("box-shadow: 0 0 0 2px #ffffff;");
    expect(css).toContain("forced-colors: active");
  });
});
