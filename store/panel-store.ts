import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { indexedDbStorage } from "@/lib/db";
import { cleanPanelState } from "@/lib/panel-state";

type PanelState = {
  /** What the person chose for a panel, by id. A panel with no entry uses its own default. */
  open: Record<string, boolean>;
  setOpen: (id: string, open: boolean) => void;
};

/** Which collapsible panels are open or folded. Kept in this browser only. */
export const usePanelStore = create<PanelState>()(
  persist(
    (set) => ({
      open: {},
      setOpen: (id, open) => set((state) => ({ open: { ...state.open, [id]: open } })),
    }),
    {
      name: "designhub:panels",
      version: 1,
      storage: createJSONStorage(() => indexedDbStorage),
      partialize: ({ open }) => ({ open }),
      merge: (persisted, current) => ({
        ...current,
        open: cleanPanelState((persisted as Partial<PanelState> | undefined)?.open),
      }),
    },
  ),
);
