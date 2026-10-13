"use client";

import { Search } from "lucide-react";
import { useState, type FormEvent } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { Kbd } from "@/components/ui/kbd";
import { useUiStore } from "@/store/ui-store";

/**
 * Looks like a regular input, but hands off to the command palette as soon
 * as the user starts typing so there is exactly one search experience.
 */
export function HeroSearch() {
  const { t } = useI18n();
  const openCommand = useUiStore((state) => state.openCommand);
  const [value, setValue] = useState("");

  function handoff(query: string) {
    // Keystrokes can land here before the palette input takes focus; append instead of replacing.
    const { commandOpen, commandQuery } = useUiStore.getState();
    openCommand(commandOpen ? commandQuery + query : query);
    setValue("");
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    handoff(value);
  }

  return (
    <form role="search" onSubmit={onSubmit} className="relative w-full max-w-xl">
      <label htmlFor="hero-search" className="sr-only">
        {t("home.search.label")}
      </label>
      <Search
        className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-subtle-foreground"
        aria-hidden
      />
      <input
        id="hero-search"
        type="search"
        autoComplete="off"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          if (event.target.value.trim()) handoff(event.target.value);
        }}
        placeholder={t("home.search.placeholder")}
        className="h-12 w-full rounded-lg border border-border-strong bg-surface pr-20 pl-11 text-[15px] shadow-sm outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-subtle-foreground hover:border-foreground/20 focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/30 [&::-webkit-search-cancel-button]:hidden"
      />
      <span className="pointer-events-none absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1">
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </span>
    </form>
  );
}
