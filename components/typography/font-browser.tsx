"use client";

import { SearchX } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { UIEvent } from "react";

import { FontCard } from "@/components/typography/font-card";
import { FontFilters } from "@/components/typography/font-filters";
import { RecentFonts } from "@/components/typography/recent-fonts";
import { Button } from "@/components/ui/button";
import { useSelectFont } from "@/hooks/use-select-font";
import { filterFonts } from "@/lib/typography/filter";
import { cn } from "@/lib/utils";
import { useLibraryStore } from "@/store/library-store";
import { useTypographyStore } from "@/store/typography-store";
import type { FontFamily } from "@/types/typography";

const PAGE_SIZE = 40;
const ROW_HEIGHT = 60;
const OVERSCAN = 8;

type FontBrowserProps = {
  fonts: FontFamily[];
  loading: boolean;
  className?: string;
};

/** Search and filters on top, a virtualized scrolling list below that loads more as you reach the end. */
export function FontBrowser({ fonts, loading, className }: FontBrowserProps) {
  const activeFont = useTypographyStore((state) => state.activeFont);
  const filters = useTypographyStore((state) => state.filters);
  const resetFilters = useTypographyStore((state) => state.resetFilters);
  const favorites = useLibraryStore((state) => state.favoriteFonts);
  const selectFont = useSelectFont();
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const results = useMemo(() => filterFonts(fonts, filters, favorites), [fonts, filters, favorites]);
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // New filters start back at the top of the list.
  useEffect(() => {
    setVisible(PAGE_SIZE);
    setScrollTop(0);
    setFocusedIndex(null);
    listRef.current?.scrollTo({ top: 0 });
  }, [filters]);

  useEffect(() => {
    const node = listRef.current;
    if (!node) return;

    const updateHeight = () => setViewportHeight(node.clientHeight);
    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  };

  const hasMore = results.length > visible;
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setVisible((count) => count + PAGE_SIZE);
      },
      { root: listRef.current, rootMargin: "400px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, visible]);

  const activeIndex = results.findIndex((font) => font.family === activeFont);
  useEffect(() => {
    if (activeIndex < 0) return;

    if (activeIndex >= visible) {
      setVisible(Math.min(results.length, Math.ceil((activeIndex + 1) / PAGE_SIZE) * PAGE_SIZE));
      return;
    }

    const node = listRef.current;
    if (!node || viewportHeight === 0) return;

    const top = activeIndex * ROW_HEIGHT;
    const bottom = top + ROW_HEIGHT;
    if (top < node.scrollTop) {
      node.scrollTo({ top });
    } else if (bottom > node.scrollTop + node.clientHeight) {
      node.scrollTo({ top: bottom - node.clientHeight });
    }
  }, [activeIndex, activeFont, results.length, viewportHeight, visible]);

  const shown = results.slice(0, visible);
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(shown.length, Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + OVERSCAN);
  const rowIndexes = Array.from({ length: Math.max(0, endIndex - startIndex) }, (_, offset) => startIndex + offset);

  if (focusedIndex !== null && focusedIndex < shown.length && (focusedIndex < startIndex || focusedIndex >= endIndex)) {
    rowIndexes.push(focusedIndex);
    rowIndexes.sort((a, b) => a - b);
  }

  return (
    <section
      aria-labelledby="google-fonts-title"
      className={cn("relative flex min-h-0 flex-col overflow-hidden rounded-lg border bg-card", className)}
    >
      <div className="flex flex-col gap-3 border-b p-4">
        <h2 id="google-fonts-title" className="text-sm font-medium">
          Google Fonts
        </h2>
        <FontFilters resultCount={results.length} />
        <RecentFonts />
      </div>
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto p-2 scrollbar-thin"
      >
        {loading ? (
          <ul className="flex flex-col gap-1" aria-busy="true" aria-label="Loading fonts">
            {Array.from({ length: 10 }, (_, index) => (
              <li key={index} className="h-[54px] animate-pulse rounded-md bg-muted/40" />
            ))}
          </ul>
        ) : null}
        {!loading && results.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <SearchX className="size-6 text-subtle-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">No fonts match these filters.</p>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Reset filters
            </Button>
          </div>
        ) : null}
        <ul
          className="relative"
          style={{ height: shown.length * ROW_HEIGHT }}
          aria-label="Fonts"
          onFocusCapture={(event) => {
            const target = event.target as HTMLElement;
            const row = target.closest<HTMLElement>("[data-font-index]");
            if (row) setFocusedIndex(Number(row.dataset.fontIndex));
          }}
        >
          {rowIndexes.map((index) => {
            const font = shown[index];
            if (!font) return null;

            return (
              <li
                key={font.family}
                data-font-index={index}
                className="absolute inset-x-0 h-[60px]"
                style={{ top: index * ROW_HEIGHT }}
                aria-setsize={results.length}
                aria-posinset={index + 1}
              >
                <FontCard font={font} active={font.family === activeFont} onSelect={selectFont} />
              </li>
            );
          })}
        </ul>
        {hasMore ? (
          <div ref={sentinelRef} className="flex justify-center py-3">
            <Button variant="ghost" size="sm" onClick={() => setVisible((count) => count + PAGE_SIZE)}>
              Show more · {results.length - visible} remaining
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
