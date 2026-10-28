"use client";

import { useI18n } from "@/components/layout/locale-provider";
import { GroupedPicker, type PickerGroup } from "@/components/ui/grouped-picker";
import { effectCategories } from "@/lib/effects/define";
import { effectDefinitions } from "@/lib/effects/registry";
import { useEffectsStore } from "@/store/effects-store";
import type { EffectKind } from "@/types/effects";

export function EffectPicker() {
  const { t } = useI18n();
  const kind = useEffectsStore((state) => state.kind);
  const setKind = useEffectsStore((state) => state.setKind);

  if (effectDefinitions.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">{t("effects.picker.empty")}</p>
    );
  }

  const groups: PickerGroup[] = effectCategories
    .map((category) => ({
      id: category,
      label: t(`effects.category.${category}`),
      items: effectDefinitions
        .filter((definition) => definition.category === category)
        .map((definition) => ({
          id: definition.kind,
          label: t(`effects.kind.${definition.kind}.label`),
          description: t(`effects.kind.${definition.kind}.description`),
          keywords: definition.kind,
        })),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <GroupedPicker
      groups={groups}
      value={kind}
      onChange={(id) => setKind(id as EffectKind)}
      label={t("effects.picker.label")}
      searchLabel={t("effects.picker.search")}
      noMatch={t("effects.picker.noMatch")}
    />
  );
}
