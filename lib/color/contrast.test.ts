import { describe, expect, test } from "vitest";
import { wcagChecks, ratingLabel, formatRatio, suggestForeground } from "./contrast";
import { oklch, contrastRatio } from "./color";

describe("wcagChecks", () => {
  test("returns all criteria with the expected thresholds", () => {
    expect(wcagChecks(5).map(({ id, threshold }) => ({ id, threshold }))).toEqual([
      { id: "normal-aa", threshold: 4.5 },
      { id: "normal-aaa", threshold: 7 },
      { id: "large-aa", threshold: 3 },
      { id: "large-aaa", threshold: 4.5 },
      { id: "ui", threshold: 3 },
    ]);
  });

  test.each([
    { ratio: 5, expected: true, scenario: "above threshold" },
    { ratio: 4, expected: false, scenario: "below threshold" },
    { ratio: 4.5, expected: true, scenario: "at threshold" },
    { ratio: 4.49, expected: false, scenario: "just below threshold" },
    { ratio: 4.51, expected: true, scenario: "just above threshold" },
  ])("normal-aa: $scenario", ({ ratio, expected }) => {
    const checks = wcagChecks(ratio);
    const check = checks.find((item) => item.id === "normal-aa");

    expect(check?.pass).toBe(expected);
  });

  test.each([
    { ratio: 8, expected: true, scenario: "above threshold" },
    { ratio: 6, expected: false, scenario: "below threshold" },
    { ratio: 7, expected: true, scenario: "at threshold" },
    { ratio: 6.99, expected: false, scenario: "just below threshold" },
    { ratio: 7.01, expected: true, scenario: "just above threshold" },
  ])("normal-aaa: $scenario", ({ ratio, expected }) => {
    const checks = wcagChecks(ratio);
    const check = checks.find((item) => item.id === "normal-aaa");

    expect(check?.pass).toBe(expected);
  });

  test.each([
    { ratio: 4, expected: true, scenario: "above threshold" },
    { ratio: 2, expected: false, scenario: "below threshold" },
    { ratio: 3, expected: true, scenario: "at threshold" },
    { ratio: 2.99, expected: false, scenario: "just below threshold" },
    { ratio: 3.01, expected: true, scenario: "just above threshold" },
  ])("large-aa: $scenario", ({ ratio, expected }) => {
    const checks = wcagChecks(ratio);
    const check = checks.find((item) => item.id === "large-aa");

    expect(check?.pass).toBe(expected);
  });

  test.each([
    { ratio: 5, expected: true, scenario: "above threshold" },
    { ratio: 4, expected: false, scenario: "below threshold" },
    { ratio: 4.5, expected: true, scenario: "at threshold" },
    { ratio: 4.49, expected: false, scenario: "just below threshold" },
    { ratio: 4.51, expected: true, scenario: "just above threshold" },
  ])("large-aaa: $scenario", ({ ratio, expected }) => {
    const checks = wcagChecks(ratio);
    const check = checks.find((item) => item.id === "large-aaa");

    expect(check?.pass).toBe(expected);
  });

  test.each([
    { ratio: 4, expected: true, scenario: "above threshold" },
    { ratio: 2, expected: false, scenario: "below threshold" },
    { ratio: 3, expected: true, scenario: "at threshold" },
    { ratio: 2.99, expected: false, scenario: "just below threshold" },
    { ratio: 3.01, expected: true, scenario: "just above threshold" },
  ])("UI components: $scenario", ({ ratio, expected }) => {
    const checks = wcagChecks(ratio);
    const check = checks.find((item) => item.id === "ui");

    expect(check?.pass).toBe(expected);
  });
});

describe("ratingLabel", () => {
  test.each([
    { ratio: 8, expected: "AAA" },
    { ratio: 5, expected: "AA" },
    { ratio: 4, expected: "AA Large" },
    { ratio: 0, expected: "Fail" },
  ])("returns $expected for ratio $ratio", ({ ratio, expected }) => {
    expect(ratingLabel(ratio)).toBe(expected);
  });

  describe("edge cases", () => {
    test.each([
      { ratio: 7, expected: "AAA" },
      { ratio: 6.99, expected: "AA" },
      { ratio: 4.5, expected: "AA" },
      { ratio: 4.49, expected: "AA Large" },
      { ratio: 3, expected: "AA Large" },
      { ratio: 2.99, expected: "Fail" },
      { ratio: -4.5, expected: "Fail" },
    ])("returns $expected for ratio $ratio", ({ ratio, expected }) => {
      expect(ratingLabel(ratio)).toBe(expected);
    });
  });
});

describe("formatRatio", () => {
  test.each([
    { ratio: 10.5, expected: "10.50:1" },
    { ratio: 5, expected: "5.00:1" },
    { ratio: 3.99, expected: "3.99:1" },
    { ratio: 1.999, expected: "1.99:1" },
    { ratio: 0.1, expected: "0.10:1" },
  ])("formats ratio $ratio to $expected", ({ ratio, expected }) => {
    expect(formatRatio(ratio)).toBe(expected);
  });
});

describe("suggestForeground", () => {
  test("returns null when foreground already meets target contrast", () => {
    const fg = oklch(0, 0, 0);
    const bg = oklch(1, 0, 0);

    expect(suggestForeground(fg, bg)).toBeNull();
  });

  test("suggests a foreground color that meets target contrast", () => {
    const fg = oklch(0.7, 0, 0);
    const bg = oklch(1, 0, 0);
    const target = 4.5;

    const result = suggestForeground(fg, bg, target);

    expect(result).not.toBeNull();
    expect(contrastRatio(result!, bg)).toBeGreaterThanOrEqual(target);
  });

  test("returns null when no suitable foreground color exists", () => {
    const fg = oklch(0.5, 0.1, 250, 0);
    const bg = oklch(0.5, 0.1, 250, 0);

    expect(suggestForeground(fg, bg, 21)).toBeNull();
  });

  test("suggests a foreground color for a dark background", () => {
    const fg = oklch(0.3, 0, 0);
    const bg = oklch(0, 0, 0);
    const target = 4.5;

    const result = suggestForeground(fg, bg, target);

    expect(result).not.toBeNull();
    expect(contrastRatio(fg, bg)).toBeLessThan(target);
    expect(contrastRatio(result!, bg)).toBeGreaterThanOrEqual(target);
  });
});
