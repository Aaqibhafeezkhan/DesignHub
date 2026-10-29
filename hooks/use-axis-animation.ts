"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

const CYCLE_MS = 4000;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function reducedMotionSnapshot() {
  return typeof window !== "undefined" && window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function subscribeToReducedMotion(onChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeToReducedMotion, reducedMotionSnapshot, () => false);
}

/**
 * Sweeps a value back and forth between `min` and `max` using requestAnimationFrame.
 * Stops automatically on unmount or when `stop` is called.
 */
export function useAxisAnimation(onFrame: (value: number, id?: string) => void) {
  const [playing, setPlaying] = useState<string | null>(null);
  const frame = useRef<number | null>(null);
  const onFrameRef = useRef(onFrame);
  const prefersReducedMotion = usePrefersReducedMotion();
  onFrameRef.current = onFrame;

  const stop = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    setPlaying(null);
  }, []);

  const play = useCallback(
    (id: string, min: number, max: number) => {
      stop();
      if (prefersReducedMotion) {
        onFrameRef.current(Math.round(((min + max) / 2) * 100) / 100, id);
        return;
      }
      const start = performance.now();
      setPlaying(id);
      const tick = (now: number) => {
        const phase = ((now - start) % CYCLE_MS) / CYCLE_MS;
        // Ease in-out sine wave from min → max → min.
        const eased = (1 - Math.cos(phase * Math.PI * 2)) / 2;
        onFrameRef.current(Math.round((min + (max - min) * eased) * 100) / 100, id);
        frame.current = requestAnimationFrame(tick);
      };
      frame.current = requestAnimationFrame(tick);
    },
    [prefersReducedMotion, stop],
  );

  useEffect(() => stop, [stop]);

  return { playing, play, stop };
}
