"use client";

import { GroupedPicker, type PickerGroup } from "@/components/ui/grouped-picker";
import { backgroundCategories } from "@/lib/background/categories";
import { backgroundGenerators } from "@/lib/background/registry";
import { useBackgroundStore } from "@/store/background-store";
import type { BackgroundKind } from "@/types/background";

export function GeneratorPicker() {
  const kind = useBackgroundStore((state) => state.settings.kind);
  const setKind = useBackgroundStore((state) => state.setKind);

  if (backgroundGenerators.length === 0) {
    return <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No generators yet.</p>;
  }

  const groups: PickerGroup[] = backgroundCategories
    .map((category) => ({
      id: category.id,
      label: category.label,
      items: backgroundGenerators
        .filter((generator) => generator.category === category.id)
        .map((generator) => ({
          id: generator.kind,
          label: generator.label,
          description: generator.description,
          keywords: [
            generator.kind,
            ...(generator.variants?.map((variant) => `${variant.label} ${variant.variant}`) ?? []),
          ].join(" "),
        })),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <GroupedPicker
      groups={groups}
      value={kind}
      onChange={(id) =>
        setKind(
          id as BackgroundKind,
          backgroundGenerators.find((generator) => generator.kind === id),
        )
      }
      label="Generator"
      searchLabel="Find a generator"
      noMatch="No generator matches that search."
    />
  );
}
