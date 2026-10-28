"use client";

import { useCallback, useState } from "react";

const ZOOM_STEPS = [0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8];

/** Zoom state where `null` means "fit to container". */
export function useZoom() {
  const [zoom, setZoom] = useState<number | null>(null);

  const step = useCallback((direction: 1 | -1, current: number) => {
    const next =
      direction === 1
        ? ZOOM_STEPS.find((value) => value > current + 0.001)
        : [...ZOOM_STEPS].reverse().find((value) => value < current - 0.001);
    setZoom(next ?? (direction === 1 ? ZOOM_STEPS[ZOOM_STEPS.length - 1]! : ZOOM_STEPS[0]!));
  }, []);

  return { zoom, setZoom, step, fit: () => setZoom(null) };
}
