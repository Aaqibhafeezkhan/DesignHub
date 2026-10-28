"use client";

import { useEffect, useMemo, useState } from "react";

import { getGenerator, renderBackgroundSvg } from "@/lib/background/registry";
import { Superseded } from "@/lib/background/render-client";
import { wrapSvg } from "@/lib/background/svg";
import type { BackgroundSettings } from "@/types/background";

/**
 * The SVG for the settings. Light generators draw on the page. The heavy ones draw in a worker, and the
 * last drawing stays until the new one arrives, so a slider keeps up with the hand.
 * `paperReady` re-draws the generators that wait for Paper.js once it has loaded.
 */
export function useBackgroundSvg(settings: BackgroundSettings, paperReady: boolean): string {
  const heavy = Boolean(getGenerator(settings.kind)?.heavy);
  const inline = useMemo(
    () => (heavy ? null : renderBackgroundSvg(settings)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- paperReady is a dependency on purpose
    [heavy, settings, paperReady],
  );
  const placeholder = useMemo(() => wrapSvg(settings, ""), [settings]);
  const [drawn, setDrawn] = useState<string | null>(null);

  useEffect(() => {
    if (!heavy) return;
    let current = true;
    // The worker and its client load with the first heavy drawing, not with the page.
    void import("@/lib/background/render-in-worker")
      .then(({ renderInWorker }) => renderInWorker(settings))
      .then((svg) => current && setDrawn(svg))
      .catch((error: unknown) => {
        if (!(error instanceof Superseded)) setDrawn(renderBackgroundSvg(settings));
      });
    return () => {
      current = false;
    };
  }, [heavy, settings]);

  return inline ?? drawn ?? placeholder;
}
