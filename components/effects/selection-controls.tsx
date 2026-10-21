"use client";

import { Check, X } from "lucide-react";

import { ColorField } from "@/components/effects/fields";
import { Badge } from "@/components/ui/badge";
import { SELECTION_MIN_CONTRAST, selectionContrast } from "@/lib/effects/selection";
import { useEffectSettings, useEffectsStore } from "@/store/effects-store";

export function SelectionControls() {
  const s = useEffectSettings("selection");
  const update = useEffectsStore((state) => state.update);
  const set = (patch: Partial<typeof s>) => update("selection", patch);
  const ratio = selectionContrast(s);
  const pass = ratio >= SELECTION_MIN_CONTRAST;

  return (
    <>
      <ColorField label="Selection background" value={s.background} onChange={(background) => set({ background })} />
      <ColorField label="Selected text" value={s.text} onChange={(text) => set({ text })} />
      <ColorField label="Page background" value={s.page} onChange={(page) => set({ page })} />
      <div className="flex flex-col gap-2 rounded-lg border p-3" role="status" aria-live="polite">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">Selected text contrast (1.4.3)</span>
          <Badge variant={pass ? "success" : "destructive"}>
            {pass ? <Check aria-hidden /> : <X aria-hidden />}
            {pass ? "Pass" : "Fail"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Text against the selection: {(Math.floor(ratio * 100) / 100).toFixed(2)}:1. At least {SELECTION_MIN_CONTRAST}
          :1 is required.
        </p>
      </div>
    </>
  );
}
