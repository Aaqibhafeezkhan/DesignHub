"use client";

import { Check, X } from "lucide-react";

import { useI18n } from "@/components/layout/locale-provider";
import { ColorField } from "@/components/effects/fields";
import { SliderField } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { focusRingCheck } from "@/lib/effects/focus-ring";
import { useEffectSettings, useEffectsStore } from "@/store/effects-store";

export function FocusRingControls() {
  const { t } = useI18n();
  const s = useEffectSettings("focus-ring");
  const update = useEffectsStore((state) => state.update);
  const set = (patch: Partial<typeof s>) => update("focus-ring", patch);
  const pxFormat = (value: number) => `${value}px`;
  const check = focusRingCheck(s);
  const ratio = (value: number) => (Math.floor(value * 100) / 100).toFixed(2);

  return (
    <>
      <ColorField label={t("effects.focusRing.outer")} value={s.color} onChange={(color) => set({ color })} />
      <ColorField label={t("effects.focusRing.inner")} value={s.inner} onChange={(inner) => set({ inner })} />
      <SliderField
        label={t("effects.focusRing.width")}
        value={s.width}
        min={1}
        max={8}
        step={0.5}
        onChange={(width) => set({ width })}
        format={pxFormat}
      />
      <SliderField
        label={t("effects.focusRing.offset")}
        value={s.offset}
        min={0}
        max={8}
        step={0.5}
        onChange={(offset) => set({ offset })}
        format={pxFormat}
      />
      <ColorField
        label={t("effects.focusRing.background")}
        value={s.background}
        onChange={(background) => set({ background })}
      />
      <ColorField
        label={t("effects.focusRing.component")}
        value={s.component}
        onChange={(component) => set({ component })}
      />
      <div className="flex flex-col gap-2 rounded-lg border p-3" role="status">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{t("effects.focusRing.title")}</span>
          <Badge variant={check.pass ? "success" : "destructive"}>
            {check.pass ? <Check aria-hidden /> : <X aria-hidden />}
            {check.pass ? t("effects.badge.pass") : t("effects.badge.fail")}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("effects.focusRing.summary", {
            page: ratio(check.backgroundRatio),
            component: ratio(check.componentRatio),
            required: check.required,
          })}
        </p>
        {check.suggestion ? (
          <button
            type="button"
            className="w-fit text-xs underline underline-offset-2"
            onClick={() => set({ color: check.suggestion! })}
          >
            {t("effects.focusRing.useSuggestion", { color: check.suggestion })}
          </button>
        ) : null}
      </div>
    </>
  );
}
