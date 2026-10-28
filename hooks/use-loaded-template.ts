"use client";

import { useEffect, useState } from "react";

/**
 * The template a studio draws: the one with this id, once its code has loaded. Until then it keeps
 * the previous template, so the preview shows the last drawing instead of going blank on a switch.
 */
export function useLoadedTemplate<T extends { id: string }>(
  id: string | undefined,
  load: (id: string) => Promise<T | undefined>,
): T | undefined {
  const [loaded, setLoaded] = useState<T | undefined>();

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void load(id).then((template) => {
      if (!cancelled && template) setLoaded(template);
    });
    return () => {
      cancelled = true;
    };
  }, [id, load]);

  return loaded;
}
