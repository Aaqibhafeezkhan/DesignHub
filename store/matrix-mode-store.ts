import { create } from "zustand";

import type { MatrixMode } from "@/lib/color/matrix";

/** The contrast matrix's WCAG or APCA view. Not persisted: it lasts for the session, not across reloads. */
export const useMatrixModeStore = create<{ mode: MatrixMode; setMode: (mode: MatrixMode) => void }>((set) => ({
  mode: "wcag",
  setMode: (mode) => set({ mode }),
}));
