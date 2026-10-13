"use client";

import { ColorField, SwitchField } from "@/components/effects/fields";
import { SliderField } from "@/components/ui/field";
import { useEffectSettings, useEffectsStore } from "@/store/effects-store";

export function TextOutlineControls() {
  const s = useEffectSettings("text-outline");
  const update = useEffectsStore((state) => state.update);
  const set = (patch: Partial<typeof s>) => update("text-outline", patch);
  const pxFormat = (value: number) => `${value}px`;

  return (
    <>
      <ColorField label="Outline color" value={s.color} onChange={(color) => set({ color })} />
      <SliderField
        label="Outline width"
        value={s.width}
        min={0.5}
        max={12}
        step={0.5}
        onChange={(width) => set({ width })}
        format={pxFormat}
      />
      <SwitchField label="Hollow letters" checked={s.hollow} onChange={(hollow) => set({ hollow })} />
      {s.hollow ? null : <ColorField label="Fill" value={s.fill} onChange={(fill) => set({ fill })} />}
      <SwitchField label="Offset shadow copy" checked={s.shadow} onChange={(shadow) => set({ shadow })} />
      {s.shadow ? (
        <>
          <SliderField
            label="Shadow X"
            value={s.shadowX}
            min={-24}
            max={24}
            onChange={(shadowX) => set({ shadowX })}
            format={pxFormat}
          />
          <SliderField
            label="Shadow Y"
            value={s.shadowY}
            min={-24}
            max={24}
            onChange={(shadowY) => set({ shadowY })}
            format={pxFormat}
          />
          <ColorField label="Shadow color" value={s.shadowColor} onChange={(shadowColor) => set({ shadowColor })} />
        </>
      ) : null}
    </>
  );
}
