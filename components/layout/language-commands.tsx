"use client";

import { Check, Languages } from "lucide-react";

import { useI18n } from "@/components/layout/locale-provider";
import { CommandGroup, CommandItem } from "@/components/ui/command";
import { localeNames } from "@/lib/i18n/locales";
import { matchLocales } from "@/lib/i18n/search";

/**
 * Language choices for the command palette. They appear when the query is "language" (in any
 * interface language) or part of a language's own name, such as "Español" or "Fran".
 */
export function LanguageCommands({ query, onDone }: { query: string; onDone: () => void }) {
  const { locale, setLocale, t } = useI18n();
  const matches = matchLocales(query, t("command.group.language"));

  if (matches.length === 0) return null;

  return (
    <CommandGroup heading={t("command.group.language")}>
      {matches.map((item) => {
        const current = item === locale;
        return (
          <CommandItem
            key={item}
            // Contains the whole query so cmdk ranks these above fuzzy matches elsewhere.
            value={`language ${localeNames[item]} ${query}`}
            data-checked={current ? "true" : undefined}
            aria-label={current ? `${localeNames[item]}, ${t("command.currentLanguage")}` : localeNames[item]}
            onSelect={() => {
              onDone();
              setLocale(item);
            }}
          >
            <Languages />
            <span lang={item}>{localeNames[item]}</span>
            {current ? <Check className="ml-auto" aria-hidden /> : null}
          </CommandItem>
        );
      })}
    </CommandGroup>
  );
}
