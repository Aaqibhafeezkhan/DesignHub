"use client";

import { Check, X } from "lucide-react";

import { ColorField } from "@/components/effects/fields";
import { Badge } from "@/components/ui/badge";
import { SliderField } from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { SCRIM_MIN_CONTRAST, scrimContrast } from "@/lib/effects/scrim";
import { useEffectSettings, useEffectsStore } from "@/store/effects-store";
import type { ScrimDirection } from "@/types/effects";

const ratioText = (value: number) => (Math.floor(value * 100) / 100).toFixed(2);

export function ScrimControls() {
  const s = useEffectSettings("scrim");
  const update = useEffectsStore((state) => state.update);
  const set = (patch: Partial<typeof s>) => update("scrim", patch);
  const contrast = scrimContrast(s);
  const pass = contrast.darkest >= SCRIM_MIN_CONTRAST;

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Direction</span>
        <ToggleGroup
          type="single"
          value={s.direction}
          onValueChange={(value) => value && set({ direction: value as ScrimDirection })}
          aria-label="Scrim direction"
        >
          <ToggleGroupItem value="bottom">Bottom</ToggleGroupItem>
          <ToggleGroupItem value="top">Top</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <SliderField
        label="Strength"
        value={s.strength}
        min={0}
        max={1}
        step={0.01}
        onChange={(strength) => set({ strength })}
        format={(v) => `${Math.round(v * 100)}%`}
      />
      <SliderField
        label="Height"
        value={s.height}
        min={20}
        max={100}
        step={1}
        onChange={(height) => set({ height })}
        format={(v) => `${v}%`}
      />
      <ColorField label="Scrim color" value={s.color} onChange={(color) => set({ color })} />
      <ColorField label="Text color" value={s.text} onChange={(text) => set({ text })} />
      <div className="flex flex-col gap-2 rounded-lg border p-3" role="status" aria-live="polite">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">Text contrast (WCAG AA)</span>
          <Badge variant={pass ? "success" : "destructive"}>
            {pass ? <Check aria-hidden /> : <X aria-hidden />}
            {pass ? "Pass" : "Fail"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Over a white image, the text is {ratioText(contrast.darkest)}:1 where the scrim is strongest and{" "}
          {ratioText(contrast.lightest)}:1 where it fades out. At least {SCRIM_MIN_CONTRAST}:1 is required.
        </p>
        <p className="text-xs text-muted-foreground">
          {pass
            ? `Text stays readable for the first ${Math.round(contrast.readableDepth * 100)}% of the scrim's height.`
            : "Raise the strength or pick a text color that contrasts with the scrim."}
        </p>
      </div>
    </>
  );
}
