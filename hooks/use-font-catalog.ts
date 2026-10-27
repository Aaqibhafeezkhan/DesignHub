"use client";

import { useEffect, useMemo, useState } from "react";

import { loadFontCatalog, loadFontIndex, loadFontMeta, type FontSummary } from "@/lib/typography/catalog";
import type { FontFamily } from "@/types/typography";

/** Resolves a loader once on mount; `fonts` stays empty until it does. */
function useLoaded<T>(load: () => Promise<T[]>): { fonts: T[]; loading: boolean } {
  const [fonts, setFonts] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    load().then((loaded) => {
      if (cancelled) return;
      setFonts(loaded);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  return { fonts, loading };
}

/** The whole catalog with details, for browsing. Everything that only names fonts should use the index. */
export function useFontCatalog(): { fonts: FontFamily[]; loading: boolean } {
  return useLoaded(loadFontCatalog);
}

/** Every family with its category and rank, enough to list and search fonts. */
export function useFontIndex(): { fonts: FontSummary[]; loading: boolean } {
  return useLoaded(loadFontIndex);
}

/** Metadata for a single family, or undefined while it loads. Only the category that holds it is fetched. */
export function useFontMeta(family: string): FontFamily | undefined {
  const [loaded, setLoaded] = useState<FontFamily | undefined>();

  useEffect(() => {
    let cancelled = false;
    void loadFontMeta(family).then((meta) => {
      if (!cancelled) setLoaded(meta);
    });
    return () => {
      cancelled = true;
    };
  }, [family]);

  // A stale result for the previous family is never returned while the next one loads.
  return useMemo(() => (loaded?.family === family ? loaded : undefined), [loaded, family]);
}
