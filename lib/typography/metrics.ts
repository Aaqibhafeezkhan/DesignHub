import type { FontMetrics } from "@/lib/typography/fallback";

/**
 * Latin metrics for each catalog family (ascent, descent, lineGap, unitsPerEm, avgCharWidth).
 * Derived from the MIT-licensed Capsize metrics collection for the Regular face.
 */

let cache: Promise<Record<string, FontMetrics>> | null = null;

/** Lazily loads bundled latin metrics for catalog families (code-split). */
export function loadFontMetrics(): Promise<Record<string, FontMetrics>> {
  cache ??= import("./metrics.json").then((module) => {
    const data: unknown = module.default;
    return data && typeof data === "object" ? (data as Record<string, FontMetrics>) : {};
  });
  return cache;
}

export function metricsFor(table: Record<string, FontMetrics>, family: string): FontMetrics | undefined {
  return table[family];
}
