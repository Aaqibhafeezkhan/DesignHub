"use client";

import { FlipHorizontal2, FlipVertical2, RotateCcw, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SliderField } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Advanced } from "@/components/ui/advanced";
import { Panel } from "@/components/ui/panel";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useIcon } from "@/hooks/use-icon-data";
import { useHotkey } from "@/hooks/use-hotkeys";
import { toHex } from "@/lib/color/color";
import { usesStroke } from "@/lib/icons/svg";
import { cn } from "@/lib/utils";
import { useColorStore } from "@/store/color-store";
import { useIconStore } from "@/store/icon-store";
import type { IconBackground, IconCorners } from "@/types/icons";

function ColorChoices({
  value,
  onChange,
  allowCurrent,
}: {
  value: string;
  onChange: (color: string) => void;
  allowCurrent?: boolean;
}) {
  const swatches = useColorStore((state) => state.swatches);
  const colors = [...new Set(swatches.map((swatch) => toHex({ ...swatch.color, alpha: 1 })))];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {allowCurrent ? (
        <button
          type="button"
          onClick={() => onChange("currentColor")}
          aria-pressed={value === "currentColor"}
          className="h-7 rounded-md border px-2 font-mono text-[11px] text-muted-foreground aria-pressed:border-brand/60 aria-pressed:text-foreground"
        >
          currentColor
        </button>
      ) : null}
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          aria-label={`Use ${color}`}
          aria-pressed={value === color}
          className={cn(
            "size-7 rounded-md border ring-offset-2 ring-offset-card",
            value === color && "ring-2 ring-foreground",
          )}
          style={{ background: color }}
        />
      ))}
      <label
        className="relative size-7 cursor-pointer overflow-hidden rounded-md border bg-[conic-gradient(red,yellow,lime,aqua,blue,magenta,red)]"
        title="Custom color"
      >
        <input
          type="color"
          aria-label="Custom color"
          value={value.startsWith("#") ? value.slice(0, 7) : "#6366f1"}
          onChange={(event) => onChange(event.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
    </div>
  );
}

export function IconControls() {
  const selected = useIconStore((state) => state.selected);
  const style = useIconStore((state) => state.style);
  const updateStyle = useIconStore((state) => state.updateStyle);
  const resetStyle = useIconStore((state) => state.resetStyle);
  const icon = useIcon(selected);
  const stroked = icon ? usesStroke(icon) : false;

  const rotateBy = (delta: number) => updateStyle({ rotate: (((style.rotate + delta) % 360) + 360) % 360 });
  useHotkey("r", () => rotateBy(90));
  useHotkey("shift+r", () => rotateBy(-90));

  const setBackground = (patch: Partial<IconBackground>) => {
    const background = { ...style.background, ...patch };
    // A glyph edge-to-edge on a shape looks cramped; give it breathing room the first time.
    const padding = background.shape !== "none" && style.padding === 0 ? 18 : style.padding;
    updateStyle({ background, padding });
  };

  return (
    <Panel
      title="Edit"
      actions={
        <Button variant="ghost" size="icon" aria-label="Reset icon styling" onClick={resetStyle}>
          <RotateCcw />
        </Button>
      }
    >
      <div className="flex flex-col gap-2">
        <Label>Color</Label>
        <ColorChoices value={style.color} onChange={(color) => updateStyle({ color })} allowCurrent />
      </div>

      <SliderField
        label={stroked ? "Stroke width" : "Stroke width (fill icon)"}
        value={style.strokeWidth ?? 2}
        min={0.5}
        max={4}
        step={0.25}
        onChange={(strokeWidth) => stroked && updateStyle({ strokeWidth })}
        format={(value) => (style.strokeWidth === null ? "original" : value.toFixed(2))}
        className={cn(!stroked && "pointer-events-none opacity-50")}
      />

      <Advanced>
        <div className="flex flex-col gap-2">
          <Label>Corners</Label>
          <ToggleGroup
            type="single"
            value={style.corners}
            onValueChange={(value) => value && updateStyle({ corners: value as IconCorners })}
            aria-label="Stroke corners"
            className="w-full"
            disabled={!stroked}
          >
            <ToggleGroupItem value="default" className="flex-1">
              Original
            </ToggleGroupItem>
            <ToggleGroupItem value="rounded" className="flex-1">
              Rounded
            </ToggleGroupItem>
            <ToggleGroupItem value="sharp" className="flex-1">
              Sharp
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Transform</Label>
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              aria-label="Rotate left"
              title="Rotate left · ⇧R"
              onClick={() => rotateBy(-90)}
            >
              <RotateCcw />
            </Button>
            <Button
              variant="outline"
              size="sm"
              aria-label="Rotate right"
              title="Rotate right · R"
              onClick={() => rotateBy(90)}
            >
              <RotateCw />
            </Button>
            <Button
              variant="outline"
              size="sm"
              aria-label="Flip horizontally"
              aria-pressed={style.flipH}
              className={cn(style.flipH && "border-brand/60 text-brand")}
              onClick={() => updateStyle({ flipH: !style.flipH })}
            >
              <FlipHorizontal2 />
            </Button>
            <Button
              variant="outline"
              size="sm"
              aria-label="Flip vertically"
              aria-pressed={style.flipV}
              className={cn(style.flipV && "border-brand/60 text-brand")}
              onClick={() => updateStyle({ flipV: !style.flipV })}
            >
              <FlipVertical2 />
            </Button>
          </div>
          <SliderField
            label="Rotation"
            value={style.rotate}
            min={0}
            max={359}
            onChange={(rotate) => updateStyle({ rotate })}
            format={(v) => `${v}°`}
          />
        </div>
      </Advanced>

      <SliderField
        label="Padding"
        value={style.padding}
        min={0}
        max={30}
        onChange={(padding) => updateStyle({ padding })}
        format={(v) => `${v}%`}
      />

      <div className="flex flex-col gap-2 border-t pt-4">
        <Label>Background</Label>
        <ToggleGroup
          type="single"
          value={style.background.shape}
          onValueChange={(value) => value && setBackground({ shape: value as IconBackground["shape"] })}
          aria-label="Background shape"
          className="w-full"
        >
          {(["none", "circle", "rounded", "square"] as const).map((shape) => (
            <ToggleGroupItem key={shape} value={shape} className="flex-1 capitalize">
              {shape}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {style.background.shape !== "none" ? (
          <ColorChoices value={style.background.color} onChange={(color) => setBackground({ color })} />
        ) : null}
      </div>
    </Panel>
  );
}
