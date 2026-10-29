"use client";

import { AlertTriangle, RotateCw } from "lucide-react";
import { memo, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { flushSync } from "react-dom";

import { IconGlyph } from "@/components/icons/icon-image";
import { Button } from "@/components/ui/button";
import { useIconData } from "@/hooks/use-icon-data";
import { useWindowedGrid } from "@/hooks/use-windowed-grid";
import { splitIconId } from "@/lib/icons/iconify";
import { defaultIconStyle } from "@/lib/icons/svg";
import { cn } from "@/lib/utils";
import { useIconStore } from "@/store/icon-store";
import type { IconData, IconId } from "@/types/icons";

type IconGridProps = {
  ids: IconId[];
  emptyMessage?: string;
};

const gridStyle = { ...defaultIconStyle, size: 32 };

export function IconsError({ onRetry, message }: { onRetry: () => void; message?: string }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center">
      <AlertTriangle className="size-5 text-warning" aria-hidden />
      <p className="max-w-sm text-sm text-muted-foreground">
        {message ??
          "Couldn't reach Iconify or its mirrors. Check your connection. Icons you opened before still work offline."}
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RotateCw /> Try again
      </Button>
    </div>
  );
}

const TILE_MIN = 64;
const TILE_GAP = 8;

/**
 * Icons as a grid of tiles. Only the rows near the view are in the page, and only their bodies are fetched, so
 * a collection of thousands costs as much as a screenful. Tab still walks the whole list: at the last drawn tile
 * it draws the next one first.
 */
export function IconGrid({ ids, emptyMessage = "No icons found." }: IconGridProps) {
  const selected = useIconStore((state) => state.selected);
  const select = useIconStore((state) => state.select);
  const [focused, setFocused] = useState<number | null>(null);
  const grid = useWindowedGrid<HTMLDivElement>({ count: ids.length, minTile: TILE_MIN, gap: TILE_GAP, keep: focused });
  const windowIds = useMemo(() => ids.slice(grid.start, grid.end), [ids, grid.start, grid.end]);
  const { icons, failed, loading, error, retry } = useIconData(windowIds);
  const listRef = useRef<HTMLUListElement>(null);

  // Bodies already fetched stay known while the window moves, so scrolling back does not blink.
  const known = useRef(new Map<IconId, IconData>());
  icons.forEach((icon, id) => known.current.set(id, icon));

  if (error) return <IconsError onRetry={retry} />;
  if (ids.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
    );
  }

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey) return;
    const index = Number((event.target as HTMLElement).closest<HTMLElement>("[data-index]")?.dataset.index);
    if (Number.isNaN(index)) return;
    const next = event.shiftKey ? index - 1 : index + 1;
    const edge = event.shiftKey ? index === grid.start : index === grid.end - 1;
    if (!edge || next < 0 || next >= ids.length) return;
    event.preventDefault();
    // Draw the next tile now, then focus it, so a quick run of Tab presses never outruns the drawing.
    flushSync(() => setFocused(next));
    listRef.current?.querySelector<HTMLElement>(`[data-index="${next}"]`)?.focus();
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="sr-only" aria-live="polite">{`${ids.length} icons`}</p>
      <div ref={grid.ref} className="relative" style={{ height: grid.height }}>
        <ul
          ref={listRef}
          className="absolute inset-x-0 grid gap-2"
          style={{ top: grid.offset, gridTemplateColumns: `repeat(${grid.columns}, minmax(0, 1fr))` }}
          aria-busy={loading}
          aria-label="Icons"
          onKeyDown={onKeyDown}
        >
          {windowIds.map((id, offset) => {
            const index = grid.start + offset;
            return (
              <IconTile
                key={id}
                id={id}
                index={index}
                total={ids.length}
                icon={known.current.get(id)}
                failed={failed.has(id) || (!loading && !known.current.has(id))}
                active={id === selected}
                onSelect={select}
                onFocusTile={setFocused}
              />
            );
          })}
        </ul>
      </div>
      {!loading && failed.size > 0 ? (
        <Button variant="outline" size="sm" className="self-center" onClick={retry}>
          <RotateCw /> Retry {failed.size} icons that failed to load
        </Button>
      ) : null}
    </div>
  );
}

type IconTileProps = {
  id: IconId;
  index: number;
  total: number;
  onFocusTile: (index: number) => void;
  icon: IconData | undefined;
  failed: boolean;
  active: boolean;
  onSelect: (id: IconId) => void;
};

const IconTile = memo(function IconTile({
  id,
  index,
  total,
  icon,
  failed,
  active,
  onSelect,
  onFocusTile,
}: IconTileProps) {
  const { name } = splitIconId(id);
  return (
    <li aria-setsize={total} aria-posinset={index + 1}>
      <button
        type="button"
        data-index={index}
        onFocus={() => onFocusTile(index)}
        onClick={() => onSelect(id)}
        aria-pressed={active}
        aria-label={id}
        title={failed ? `${id} (failed to load)` : id}
        className={cn(
          "flex aspect-square w-full items-center justify-center rounded-lg border bg-card text-foreground transition-[border-color,background-color] duration-150 hover:border-border-strong hover:bg-surface-raised",
          active && "border-brand/60 bg-surface-raised",
        )}
      >
        {icon ? (
          <IconGlyph icon={icon} style={gridStyle} alt="" className="size-7" />
        ) : failed ? (
          <AlertTriangle className="size-4 text-subtle-foreground" aria-hidden />
        ) : (
          <span className="size-6 animate-pulse rounded-md bg-muted" aria-hidden />
        )}
        <span className="sr-only">{name}</span>
      </button>
    </li>
  );
});
