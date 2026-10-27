"use client";

import { useI18n } from "@/components/layout/locale-provider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cleanMode } from "@/lib/ui-mode";
import { useModeStore } from "@/store/mode-store";

/** Simple or Advanced, for every studio. Announced as a labelled group, and the choice is kept. */
export function ModeSwitch() {
  const { t } = useI18n();
  const mode = useModeStore((state) => state.mode);
  const setMode = useModeStore((state) => state.setMode);
  return (
    <ToggleGroup
      type="single"
      value={mode}
      onValueChange={(value) => {
        const next = cleanMode(value);
        if (next) setMode(next);
      }}
      aria-label={t("mode.label")}
    >
      <ToggleGroupItem value="simple" title={t("mode.simpleHint")}>
        {t("mode.simple")}
      </ToggleGroupItem>
      <ToggleGroupItem value="advanced" title={t("mode.advancedHint")}>
        {t("mode.advanced")}
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
