import { APCA_TARGETS } from "@/lib/a11y/contrast";
import { apcaContrast, contrastRatio } from "@/lib/color/color";
import { ratingLabel } from "@/lib/color/contrast";
import type { Oklch } from "@/types/color";

export type MatrixMode = "wcag" | "apca";

/** The strictest APCA Bronze level a pair reaches, or "fail" below the non-text minimum. */
export type ApcaLevel = "body" | "content" | "headline" | "nonText" | "fail";

/** How many of the four Bronze levels a pair reaches, for a level meter: 4 for body text, 0 for fail. */
export const apcaLevelRank: Record<ApcaLevel, number> = { body: 4, content: 3, headline: 2, nonText: 1, fail: 0 };

export function apcaLevel(lc: number): ApcaLevel {
  const size = Math.abs(lc);
  if (size >= APCA_TARGETS.body) return "body";
  if (size >= APCA_TARGETS.content) return "content";
  if (size >= APCA_TARGETS.headline) return "headline";
  if (size >= APCA_TARGETS.nonText) return "nonText";
  return "fail";
}

export type MatrixCell =
  | { mode: "wcag"; ratio: number; value: string; level: ReturnType<typeof ratingLabel> }
  | { mode: "apca"; lc: number; value: string; level: ApcaLevel };

/** One matrix cell for `text` drawn on `background`. APCA values are signed and rounded to whole Lc. */
export function matrixCell(text: Oklch, background: Oklch, mode: MatrixMode): MatrixCell {
  if (mode === "wcag") {
    const ratio = contrastRatio(text, background);
    return { mode, ratio, value: ratio.toFixed(1), level: ratingLabel(ratio) };
  }
  const lc = Math.round(apcaContrast(text, background));
  return { mode, lc, value: `${lc > 0 ? "+" : ""}${lc}`, level: apcaLevel(lc) };
}
