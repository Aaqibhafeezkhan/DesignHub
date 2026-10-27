import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { cleanRecentCommands, pushRecentCommand, type RecentCommandId } from "@/lib/command-recents";
import { indexedDbStorage } from "@/lib/db";

type RecentsState = {
  recent: RecentCommandId[];
  remember: (id: RecentCommandId) => void;
  clear: () => void;
};

/** The command palette's recent choices. Kept in this browser only, and cleared from the palette. */
export const useCommandRecentsStore = create<RecentsState>()(
  persist(
    (set) => ({
      recent: [],
      remember: (id) => set((state) => ({ recent: pushRecentCommand(state.recent, id) })),
      clear: () => set({ recent: [] }),
    }),
    {
      name: "designhub:command-recents",
      version: 1,
      storage: createJSONStorage(() => indexedDbStorage),
      partialize: ({ recent }) => ({ recent }),
      merge: (persisted, current) => ({
        ...current,
        recent: cleanRecentCommands((persisted as Partial<RecentsState> | undefined)?.recent),
      }),
    },
  ),
);
