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
  const svg = useBackgroundSvg(settings, paperReady);

  return (
    <StudioLayout
      id="backgrounds"
      controls={<BackgroundControls />}
      preview={<SvgPreviewCanvas svg={svg} label={`${settings.kind} background preview`} defaultBackdrop="dark" />}
      output={<BackgroundOutput svg={svg} />}
    />
  );
}
