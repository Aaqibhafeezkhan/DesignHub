"use client";

import { useEffect, useMemo, useState } from "react";

import { getGenerator, renderBackgroundSvg } from "@/lib/background/registry";
import { Superseded } from "@/lib/background/render-client";
import { wrapSvg } from "@/lib/background/svg";
import type { BackgroundSettings } from "@/types/background";

/** How long a worker drawing takes before the preview says it is working. */
const BUSY_AFTER = 150;

/**
 * The SVG for the settings. Light generators draw on the page. The heavy ones draw in a worker, and the
 * last drawing stays until the new one arrives, so a slider keeps up with the hand.
 * `paperReady` re-draws the generators that wait for Paper.js once it has loaded.
 */
export function useBackgroundSvg(settings: BackgroundSettings, paperReady: boolean): { svg: string; busy: boolean } {
  const heavy = Boolean(getGenerator(settings.kind)?.heavy);
  const inline = useMemo(
    () => (heavy ? null : renderBackgroundSvg(settings)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- paperReady is a dependency on purpose
    [heavy, settings, paperReady],
  );
  const placeholder = useMemo(() => wrapSvg(settings, ""), [settings]);
  const [drawn, setDrawn] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!heavy) {
      setBusy(false);
      return;
    }
    let current = true;
    // A drawing that takes longer than this shows a busy note, so a slow one never looks frozen.
    const timer = setTimeout(() => current && setBusy(true), BUSY_AFTER);
    // The worker and its client load with the first heavy drawing, not with the page.
    void import("@/lib/background/render-in-worker")
      .then(({ renderInWorker }) => renderInWorker(settings))
      .then((svg) => {
        clearTimeout(timer);
        if (!current) return;
        setDrawn(svg);
        setBusy(false);
      })
      .catch((error: unknown) => {
        clearTimeout(timer);
        if (error instanceof Superseded || !current) return;
        setDrawn(renderBackgroundSvg(settings));
        setBusy(false);
      });
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [heavy, settings]);

  return { svg: inline ?? drawn ?? placeholder, busy: heavy && busy };
}
