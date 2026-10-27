"use client";

import { ChevronDown, Search } from "lucide-react";
import { useId, useState } from "react";

import { Input } from "@/components/ui/input";
import { useRovingRadio } from "@/hooks/use-roving-radio";
import { filterGroups, type SearchableItem } from "@/lib/picker-search";
import { cn } from "@/lib/utils";

export type PickerItem = SearchableItem & {
  /** Small text on the right, such as a size. */
  meta?: string;
};
export type PickerGroup = { id: string; label: string; items: PickerItem[] };

type GroupedPickerProps = {
  groups: PickerGroup[];
  value: string;
  onChange: (id: string) => void;
  /** Names the search field. */
  searchLabel: string;
  /** Said when a search matches nothing. */
  noMatch: string;
  /** Names the whole list for assistive technology. */
  label: string;
  /** Columns of items inside a group. */
  columns?: 1 | 2;
};

/**
 * A radio list in groups with a search. The group of the selected item is open and the others are folded, so
 * a long list shows a handful of items; a search opens every group that has a match. One tab stop, arrow
 * keys move the selection (the same pattern as the other pickers).
 */
export function GroupedPicker({
  groups,
  value,
  onChange,
  searchLabel,
  noMatch,
  label,
  columns = 2,
}: GroupedPickerProps) {
  const rovingRef = useRovingRadio<HTMLDivElement>();
  const baseId = useId();
  const [query, setQuery] = useState("");
  const [opened, setOpened] = useState<Record<string, boolean>>({});
  const searching = query.trim().length > 0;
  const shown = searching ? filterGroups(groups, query) : groups;
  const selectedGroup = groups.find((group) => group.items.some((item) => item.id === value))?.id;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-subtle-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label={searchLabel}
          placeholder={searchLabel}
          className="pl-8"
        />
      </div>
      <div ref={rovingRef} role="group" aria-label={label} className="flex flex-col gap-2">
        {shown.map((group) => {
          const open = searching || opened[group.id] === true || group.id === selectedGroup;
          const listId = `${baseId}-${group.id}`;
          return (
            <div key={group.id} className="flex flex-col gap-1.5">
              <button
                type="button"
                aria-expanded={open}
                aria-controls={listId}
                onClick={() => setOpened((state) => ({ ...state, [group.id]: !open }))}
                className="flex items-center gap-1.5 self-start text-xs font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
              >
                <ChevronDown
                  className={cn("size-3.5 transition-transform duration-150", !open && "-rotate-90")}
                  aria-hidden
                />
                {group.label} <span className="font-normal">({group.items.length})</span>
              </button>
              {open ? (
                <div
                  id={listId}
                  role="radiogroup"
                  aria-label={group.label}
                  className={cn("grid gap-1.5", columns === 2 ? "grid-cols-2" : "grid-cols-1")}
                >
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={item.id === value}
                      title={item.description}
                      onClick={() => onChange(item.id)}
                      className={cn(
                        "flex h-9 min-w-0 items-center justify-between gap-2 rounded-md border px-2.5 text-left text-sm text-muted-foreground transition-colors duration-150 hover:border-border-strong hover:text-foreground",
                        item.id === value && "border-brand/60 bg-surface-raised text-foreground",
                      )}
                    >
                      <span className="truncate">{item.label}</span>
                      {item.meta ? (
                        <span className="shrink-0 font-mono text-[11px] text-subtle-foreground">{item.meta}</span>
                      ) : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
        {searching && shown.length === 0 ? <p className="text-xs text-muted-foreground">{noMatch}</p> : null}
      </div>
    </div>
  );
}
