"use client";

import type { ReactNode } from "react";

import { useModeStore } from "@/store/mode-store";

/** True in Advanced mode. */
export function useIsAdvanced(): boolean {
  return useModeStore((state) => state.mode === "advanced");
}

/**
 * Controls only Advanced mode shows. Hiding never changes a value: what is behind it keeps what it had.
 * Mark a group, not a single field, so Simple mode stays tidy.
 */
export function Advanced({ children }: { children: ReactNode }) {
  return useIsAdvanced() ? <>{children}</> : null;
}
