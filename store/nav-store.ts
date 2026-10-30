import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { indexedDbStorage } from "@/lib/db";
import { cleanFolded, toggleFolded } from "@/lib/nav-groups";
import type { StudioGroup } from "@/lib/navigation";

type NavState = {
  /** The sidebar groups the person folded. A first visit has none, so every group is open. */
  folded: StudioGroup[];
  toggle: (group: StudioGroup) => void;
  /** The sidebar shows only icons. A desktop choice, kept on this device. */
  collapsed: boolean;
  toggleCollapsed: () => void;
};

export const useNavStore = create<NavState>()(
  persist(
    (set) => ({
      folded: [],
      collapsed: false,
      toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
      toggle: (group) => set((state) => ({ folded: toggleFolded(state.folded, group) })),
    }),
    {
      name: "designhub:nav",
      version: 1,
      storage: createJSONStorage(() => indexedDbStorage),
      partialize: ({ folded, collapsed }) => ({ folded, collapsed }),
      merge: (persisted, current) => ({
        ...current,
        folded: cleanFolded((persisted as Partial<NavState> | undefined)?.folded),
        collapsed: (persisted as Partial<NavState> | undefined)?.collapsed === true,
      }),
    },
  ),
);
