import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { indexedDbStorage } from "@/lib/db";
import { cleanFolded, toggleFolded } from "@/lib/nav-groups";
import type { StudioGroup } from "@/lib/navigation";

type NavState = {
  /** The sidebar groups the person folded. A first visit has none, so every group is open. */
  folded: StudioGroup[];
  toggle: (group: StudioGroup) => void;
};

export const useNavStore = create<NavState>()(
  persist(
    (set) => ({
      folded: [],
      toggle: (group) => set((state) => ({ folded: toggleFolded(state.folded, group) })),
    }),
    {
      name: "designhub:nav",
      version: 1,
      storage: createJSONStorage(() => indexedDbStorage),
      partialize: ({ folded }) => ({ folded }),
      merge: (persisted, current) => ({
        ...current,
        folded: cleanFolded((persisted as Partial<NavState> | undefined)?.folded),
      }),
    },
  ),
);
