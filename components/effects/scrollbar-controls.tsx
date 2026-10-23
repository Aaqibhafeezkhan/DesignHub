"use client";

import { Check, X } from "lucide-react";

import { useI18n } from "@/components/layout/locale-provider";
import { ColorField } from "@/components/effects/fields";
import { Badge } from "@/components/ui/badge";
import { SliderField } from "@/components/ui/field";
import { SCROLLBAR_MIN_CONTRAST, scrollbarContrast } from "@/lib/effects/scrollbar";
import { useEffectSettings, useEffectsStore } from "@/store/effects-store";

export function ScrollbarControls() {
  const { t } = useI18n();
  const s = useEffectSettings("scrollbar");
  const update = useEffectsStore((state) => state.update);
  const set = (patch: Partial<typeof s>) => update("scrollbar", patch);
  const ratio = scrollbarContrast(s);
  const pass = ratio >= SCROLLBAR_MIN_CONTRAST;
  const pxFormat = (value: number) => `${value}px`;

  return (
    <>
      <ColorField label={t("effects.scrollbar.thumb")} value={s.thumb} onChange={(thumb) => set({ thumb })} />
      <ColorField
        label={t("effects.scrollbar.thumbHover")}
        value={s.thumbHover}
        onChange={(thumbHover) => set({ thumbHover })}
      />
      <ColorField label={t("effects.scrollbar.track")} value={s.track} onChange={(track) => set({ track })} />
      <SliderField
        label={t("effects.scrollbar.width")}
        value={s.width}
        min={4}
        max={20}
        step={1}
        onChange={(width) => set({ width })}
        format={pxFormat}
      />
      <SliderField
        label={t("effects.scrollbar.radius")}
        value={s.radius}
        min={0}
        max={10}
        step={1}
        onChange={(radius) => set({ radius })}
        format={pxFormat}
      />
      <div className="flex flex-col gap-2 rounded-lg border p-3" role="status" aria-live="polite">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{t("effects.scrollbar.title")}</span>
          <Badge variant={pass ? "success" : "destructive"}>
            {pass ? <Check aria-hidden /> : <X aria-hidden />}
            {pass ? t("effects.badge.pass") : t("effects.badge.fail")}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("effects.scrollbar.summary", {
            ratio: (Math.floor(ratio * 100) / 100).toFixed(2),
            required: SCROLLBAR_MIN_CONTRAST,
          })}
        </p>
      </div>
    </>
  );
}
