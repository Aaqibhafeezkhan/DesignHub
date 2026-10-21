"use client";

import { ColorField } from "@/components/effects/fields";
import { SliderField } from "@/components/ui/field";
import { useEffectSettings, useEffectsStore } from "@/store/effects-store";

export function DuotoneControls() {
  const s = useEffectSettings("duotone");
  const update = useEffectsStore((state) => state.update);
  const set = (patch: Partial<typeof s>) => update("duotone", patch);

  return (
    <>
      <ColorField label="Shadow color" value={s.shadow} onChange={(shadow) => set({ shadow })} />
      <ColorField label="Highlight color" value={s.highlight} onChange={(highlight) => set({ highlight })} />
      <SliderField
        label="Strength"
        value={s.strength}
        min={0}
        max={1}
        step={0.01}
        onChange={(strength) => set({ strength })}
        format={(v) => `${Math.round(v * 100)}%`}
      />
    </>
  );
}
