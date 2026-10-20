"use client";

import { Check, X } from "lucide-react";

import { ColorField } from "@/components/effects/fields";
import { Badge } from "@/components/ui/badge";
import { SliderField } from "@/components/ui/field";
import { SCROLLBAR_MIN_CONTRAST, scrollbarContrast } from "@/lib/effects/scrollbar";
import { useEffectSettings, useEffectsStore } from "@/store/effects-store";

export function ScrollbarControls() {
  const s = useEffectSettings("scrollbar");
  const update = useEffectsStore((state) => state.update);
  const set = (patch: Partial<typeof s>) => update("scrollbar", patch);
  const ratio = scrollbarContrast(s);
  const pass = ratio >= SCROLLBAR_MIN_CONTRAST;
  const pxFormat = (value: number) => `${value}px`;

  return (
    <>
      <ColorField label="Thumb" value={s.thumb} onChange={(thumb) => set({ thumb })} />
      <ColorField label="Thumb on hover" value={s.thumbHover} onChange={(thumbHover) => set({ thumbHover })} />
      <ColorField label="Track" value={s.track} onChange={(track) => set({ track })} />
      <SliderField
        label="Width"
        value={s.width}
        min={4}
        max={20}
        step={1}
        onChange={(width) => set({ width })}
        format={pxFormat}
      />
      <SliderField
        label="Thumb radius"
        value={s.radius}
        min={0}
        max={10}
        step={1}
        onChange={(radius) => set({ radius })}
        format={pxFormat}
      />
      <div className="flex flex-col gap-2 rounded-lg border p-3" role="status" aria-live="polite">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">Thumb contrast (1.4.11)</span>
          <Badge variant={pass ? "success" : "destructive"}>
            {pass ? <Check aria-hidden /> : <X aria-hidden />}
            {pass ? "Pass" : "Fail"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Thumb against the track: {(Math.floor(ratio * 100) / 100).toFixed(2)}:1. At least {SCROLLBAR_MIN_CONTRAST}:1
          is required.
        </p>
      </div>
    </>
  );
}
