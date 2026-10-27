import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { indexedDbStorage } from "@/lib/db";
import { cleanMode, startingMode, USED_APP_KEYS, type UiMode } from "@/lib/ui-mode";

type ModeState = {
  mode: UiMode;
  /** The starting mode has been chosen (on a first visit) or loaded (afterwards). */
  decided: boolean;
  setMode: (mode: UiMode) => void;
};

/**
 * Simple or Advanced, for every studio. It starts as Advanced so nothing changes for a returning person while
 * it loads; a first visit, with no saved work anywhere, then switches to Simple. A choice is never overridden.
 */
export const useModeStore = create<ModeState>()(
  persist(
    (set) => ({
      mode: "advanced",
      decided: false,
      setMode: (mode) => set({ mode, decided: true }),
    }),
    {
      name: "designhub:mode",
      version: 1,
      storage: createJSONStorage(() => indexedDbStorage),
      partialize: ({ mode, decided }) => ({ mode, decided }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<ModeState> | undefined;
        const mode = cleanMode(saved?.mode);
        return mode && saved?.decided === true ? { ...current, mode, decided: true } : current;
      },
      onRehydrateStorage: () => (state) => {
        if (!state || state.decided) return;
        void Promise.all(USED_APP_KEYS.map((key) => indexedDbStorage.getItem(key))).then((values) => {
          if (useModeStore.getState().decided) return;
          const used = values.some((value) => value !== null && value !== undefined);
          useModeStore.getState().setMode(startingMode(used));
        });
      },
    },
  ),
);
