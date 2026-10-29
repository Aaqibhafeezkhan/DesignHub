"use client";

import { BackgroundControls } from "@/components/backgrounds/background-controls";
import { BackgroundOutput } from "@/components/backgrounds/background-output";
import { StudioLayout } from "@/components/layout/studio-layout";
import { SvgPreviewCanvas } from "@/components/canvas/svg-preview-canvas";
import { useBackgroundSvg } from "@/hooks/use-background-svg";
import { usePaper } from "@/hooks/use-paper";
import { getGenerator } from "@/lib/background/registry";
import { useBackgroundStore } from "@/store/background-store";

export function BackgroundWorkspace() {
  const settings = useBackgroundStore((state) => state.settings);
  const paperReady = usePaper(Boolean(getGenerator(settings.kind)?.usesPaper));
  const { svg, busy } = useBackgroundSvg(settings, paperReady);

  return (
    <StudioLayout
      id="backgrounds"
      controls={<BackgroundControls />}
      preview={
        <div className="relative flex min-h-0 flex-1 flex-col" aria-busy={busy}>
          <SvgPreviewCanvas svg={svg} label={`${settings.kind} background preview`} defaultBackdrop="dark" />
          {busy ? (
            <p
              role="status"
              className="pointer-events-none absolute top-3 right-3 rounded-md border bg-background/90 px-2 py-1 text-xs text-muted-foreground"
            >
              Drawing…
            </p>
          ) : null}
        </div>
      }
      output={<BackgroundOutput svg={svg} />}
    />
  );
}
