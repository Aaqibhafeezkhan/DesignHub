"use client";

import { Check, X } from "lucide-react";

import { ColorField } from "@/components/effects/fields";
import { SliderField } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { focusRingCheck } from "@/lib/effects/focus-ring";
import { useEffectSettings, useEffectsStore } from "@/store/effects-store";

export function FocusRingControls() {
  const s = useEffectSettings("focus-ring");
  const update = useEffectsStore((state) => state.update);
  const set = (patch: Partial<typeof s>) => update("focus-ring", patch);
  const pxFormat = (value: number) => `${value}px`;
  const check = focusRingCheck(s);
  const ratio = (value: number) => `${(Math.floor(value * 100) / 100).toFixed(2)}:1`;

  return (
    <>
      <ColorField label="Outer ring" value={s.color} onChange={(color) => set({ color })} />
      <ColorField label="Inner ring" value={s.inner} onChange={(inner) => set({ inner })} />
      <SliderField
        label="Ring width"
        value={s.width}
        min={1}
        max={8}
        step={0.5}
        onChange={(width) => set({ width })}
        format={pxFormat}
      />
      <SliderField
        label="Offset"
        value={s.offset}
        min={0}
        max={8}
        step={0.5}
        onChange={(offset) => set({ offset })}
        format={pxFormat}
      />
      <ColorField label="Page background" value={s.background} onChange={(background) => set({ background })} />
      <ColorField label="Component color" value={s.component} onChange={(component) => set({ component })} />
      <div className="flex flex-col gap-2 rounded-lg border p-3" role="status">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">Focus indicator (2.4.13, 1.4.11)</span>
          <Badge variant={check.pass ? "success" : "destructive"}>
            {check.pass ? <Check aria-hidden /> : <X aria-hidden />}
            {check.pass ? "Pass" : "Fail"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Outer ring against the page {ratio(check.backgroundRatio)}, against the component{" "}
          {ratio(check.componentRatio)}. Both need at least {check.required}:1.
        </p>
        {check.suggestion ? (
          <button
            type="button"
            className="w-fit text-xs underline underline-offset-2"
            onClick={() => set({ color: check.suggestion! })}
          >
            Use {check.suggestion}, the nearest passing color
          </button>
        ) : null}
      </div>
    </>
  );
}
