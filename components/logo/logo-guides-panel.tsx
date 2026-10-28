"use client";

import { SwitchField } from "@/components/effects/fields";
import { SliderField } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Panel } from "@/components/ui/panel";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useLogoStore, type LogoBackdrop } from "@/store/logo-store";

const backdrops: { value: LogoBackdrop; label: string }[] = [
  { value: "checker", label: "None" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "brand", label: "Brand" },
];

export function LogoGuidesPanel() {
  const guides = useLogoStore((state) => state.guides);
  const toggleGuide = useLogoStore((state) => state.toggleGuide);
  const clearSpace = useLogoStore((state) => state.clearSpace);
  const setClearSpace = useLogoStore((state) => state.setClearSpace);
  const backdrop = useLogoStore((state) => state.backdrop);
  const setBackdrop = useLogoStore((state) => state.setBackdrop);

  return (
    <Panel collapsible id="logo-guides" title="Guides">
      <SwitchField label="Construction grid" checked={guides.grid} onChange={() => toggleGuide("grid")} />
      <SwitchField label="Clear space" checked={guides.clearSpace} onChange={() => toggleGuide("clearSpace")} />
      <SwitchField label="Safe area" checked={guides.safeArea} onChange={() => toggleGuide("safeArea")} />
      <SliderField
        label="Clear space size"
        value={clearSpace}
        min={0.1}
        max={0.5}
        step={0.05}
        onChange={setClearSpace}
        format={(value) => `${Math.round(value * 100)}% of height`}
      />
      <div className="flex flex-col gap-2">
        <Label>Background</Label>
        <ToggleGroup
          type="single"
          value={backdrop}
          onValueChange={(value) => value && setBackdrop(value as LogoBackdrop)}
          aria-label="Logo background"
          className="w-full"
        >
          {backdrops.map((item) => (
            <ToggleGroupItem key={item.value} value={item.value} className="flex-1">
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </Panel>
  );
}
