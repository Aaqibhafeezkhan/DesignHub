"use client";

import { useCallback, useEffect, useState } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { featuredIcons, fetchCollectionIcons, searchIcons } from "@/lib/icons/iconify";
import type { IconId } from "@/types/icons";

/** Results kept per search. The grid only draws the rows in view, so this can be large. */
export const SEARCH_LIMIT = 600;

export type IconResults = {
  ids: IconId[];
  total: number;
  loading: boolean;
  error: boolean;
  mode: "featured" | "search" | "collection";
  retry: () => void;
};

/** Resolves what the grid should show: search results, a collection, or featured icons. */
export function useIconResults(query: string, prefix: string | null): IconResults {
  const debounced = useDebouncedValue(query.trim(), 300);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<Omit<IconResults, "mode" | "retry">>({
    ids: featuredIcons,
    total: featuredIcons.length,
    loading: false,
    error: false,
  });
  const mode: IconResults["mode"] = debounced ? "search" : prefix ? "collection" : "featured";

  useEffect(() => {
    if (mode === "featured") {
      setState({ ids: featuredIcons, total: featuredIcons.length, loading: false, error: false });
      return;
    }
    const controller = new AbortController();
    setState((current) => ({ ...current, loading: true, error: false }));
    const request =
      mode === "search"
        ? searchIcons(debounced, { prefix: prefix ?? undefined, limit: SEARCH_LIMIT, signal: controller.signal })
        : fetchCollectionIcons(prefix ?? "", controller.signal).then((ids) => ({ icons: ids, total: ids.length }));

    request
      .then((result) => setState({ ids: result.icons, total: result.total, loading: false, error: false }))
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setState({ ids: [], total: 0, loading: false, error: true });
      });
    return () => controller.abort();
  }, [mode, debounced, prefix, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return { ...state, mode, retry };
}
