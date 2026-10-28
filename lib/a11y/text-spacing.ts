import type { A11yTypography } from "@/types/a11y";

/**
 * WCAG 1.4.12 Text Spacing (AA): no content or function may be lost when a reader sets line height
 * to 1.5 times the font size, paragraph spacing to 2 times, letter spacing to 0.12 times and word
 * spacing to 0.16 times (em values, as multiples of the font size).
 */
export const TEXT_SPACING = { lineHeight: 1.5, paragraphSpacing: 2, letterSpacing: 0.12, wordSpacing: 0.16 } as const;

/** The typography with each property raised to the WCAG minimum, never lowered. */
export function withTextSpacing(typography: A11yTypography): A11yTypography {
  return {
    ...typography,
    lineHeight: Math.max(typography.lineHeight, TEXT_SPACING.lineHeight),
    letterSpacing: Math.max(typography.letterSpacing, TEXT_SPACING.letterSpacing),
    wordSpacing: Math.max(typography.wordSpacing, TEXT_SPACING.wordSpacing),
  };
}

/** The paragraph gap in px for the test: twice the font size. */
export const paragraphSpacingPx = (size: number) => size * TEXT_SPACING.paragraphSpacing;

type TextSpacingRow = { check: string; required: string; current: string; pass: boolean };

export type TextSpacingSection = {
  criterion: string;
  note: string;
  checks: TextSpacingRow[];
};

const em = (value: number) => `${Math.round(value * 100) / 100}em`;

/**
 * The report section: whether the current typography already uses at least the spacing the
 * criterion says a reader may apply. Whether text still fits at those values is measured live in
 * the preview, so it isn't part of the saved report.
 */
export function textSpacingSection(typography: A11yTypography): TextSpacingSection {
  return {
    criterion: "WCAG 1.4.12 Text Spacing (AA)",
    note: "Content must not be clipped or overlap when a reader raises spacing to these values. Paragraph spacing (2x the font size) is applied only in the preview test.",
    checks: [
      {
        check: "Line height",
        required: `${TEXT_SPACING.lineHeight}`,
        current: `${typography.lineHeight}`,
        pass: typography.lineHeight >= TEXT_SPACING.lineHeight,
      },
      {
        check: "Letter spacing",
        required: em(TEXT_SPACING.letterSpacing),
        current: em(typography.letterSpacing),
        pass: typography.letterSpacing >= TEXT_SPACING.letterSpacing,
      },
      {
        check: "Word spacing",
        required: em(TEXT_SPACING.wordSpacing),
        current: em(typography.wordSpacing),
        pass: typography.wordSpacing >= TEXT_SPACING.wordSpacing,
      },
    ],
  };
}

/** What the live test reads from one element of the preview. */
export type BoxMetrics = {
  id: string;
  scrollWidth: number;
  clientWidth: number;
  scrollHeight: number;
  clientHeight: number;
  overflowX: string;
  overflowY: string;
};

const clips = (overflow: string) => overflow === "hidden" || overflow === "clip";

/** The elements whose content is bigger than the box and would be cut off: clipped overflow only. */
export function clippedBoxes(boxes: BoxMetrics[]): string[] {
  return boxes
    .filter(
      (box) =>
        (clips(box.overflowX) && box.scrollWidth > box.clientWidth + 1) ||
        (clips(box.overflowY) && box.scrollHeight > box.clientHeight + 1),
    )
    .map((box) => box.id);
}

export type TextSpacingStatus =
  { kind: "off" } | { kind: "unknown" } | { kind: "fits"; checked: number } | { kind: "clipped"; ids: string[] };

/** The message state for the switch: not testing, nothing to measure yet, everything fits, or what is cut off. */
export function textSpacingStatus(enabled: boolean, boxes: BoxMetrics[]): TextSpacingStatus {
  if (!enabled) return { kind: "off" };
  if (boxes.length === 0) return { kind: "unknown" };
  const ids = clippedBoxes(boxes);
  return ids.length ? { kind: "clipped", ids } : { kind: "fits", checked: boxes.length };
}
