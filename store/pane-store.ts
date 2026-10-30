import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { indexedDbStorage } from "@/lib/db";
import { cleanPaneState, type StudioPane } from "@/lib/studio-panes";

type PaneState = {
  /** The pane that was open on a phone, by studio id. A studio with no entry opens on its controls. */
  open: Record<string, StudioPane>;
  setPane: (studio: string, pane: StudioPane) => void;
};

/** Which pane each studio showed last on a phone. A view choice, kept in this browser only. */
export const usePaneStore = create<PaneState>()(
  persist(
    (set) => ({
      open: {},
      setPane: (studio, pane) => set((state) => ({ open: { ...state.open, [studio]: pane } })),
    }),
    {
      name: "designhub:pane",
      version: 1,
      storage: createJSONStorage(() => indexedDbStorage),
      partialize: ({ open }) => ({ open }),
      merge: (persisted, current) => ({
        ...current,
        open: cleanPaneState((persisted as Partial<PaneState> | undefined)?.open),
      }),
    },
  ),
);
