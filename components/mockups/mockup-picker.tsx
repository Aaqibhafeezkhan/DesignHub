"use client";

import { useState } from "react";

import { GroupedPicker, type PickerGroup } from "@/components/ui/grouped-picker";
import { useHotkey } from "@/hooks/use-hotkeys";
import { mockupTemplates } from "@/lib/mockups/registry";
import { mockupCategories } from "@/lib/mockups/types";
import { filterGroups } from "@/lib/picker-search";
import { useMockupStore } from "@/store/mockup-store";

export function MockupPicker() {
  const template = useMockupStore((state) => state.template);
  const setTemplate = useMockupStore((state) => state.setTemplate);
  const [query, setQuery] = useState("");

  const groups: PickerGroup[] = mockupCategories
    .map((category) => ({
      id: category,
      label: category,
      items: mockupTemplates
        .filter((item) => item.category === category)
        .map((item) => ({ id: item.id, label: item.label, description: item.description, keywords: item.category })),
    }))
    .filter((group) => group.items.length > 0);

  // Cycle through what is shown, in the order the picker shows it, wrapping at both ends. A search narrows it;
  // the selected template is included so cycling always starts from where the person is.
  const shown = filterGroups(groups, query).flatMap((group) => group.items);
  const cycle = (step: number) => {
    if (shown.length === 0) return;
    const index = shown.findIndex((item) => item.id === template);
    const next = shown[(Math.max(index, 0) + step + shown.length) % shown.length];
    if (next) setTemplate(next.id);
  };
  useHotkey("]", () => cycle(1));
  useHotkey("[", () => cycle(-1));

  if (mockupTemplates.length === 0) {
    return <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No templates yet.</p>;
  }

  return (
    <GroupedPicker
      groups={groups}
      value={template}
      onChange={setTemplate}
      query={query}
      onQueryChange={setQuery}
      label="Mockup template"
      searchLabel="Find a mockup"
      noMatch="No mockup matches that search."
    />
  );
}
