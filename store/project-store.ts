import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { indexedDbStorage } from "@/lib/db";
import type { ProjectSort } from "@/lib/projects/sort";

/** Which local project the live stores belong to. The projects themselves live in Dexie. */
type ProjectState = {
  activeId: string | null;
  sort: ProjectSort;
  /** Whether project exports carry each project's version history. */
  exportHistory: boolean;
  setActive: (activeId: string | null) => void;
  setSort: (sort: ProjectSort) => void;
  setExportHistory: (exportHistory: boolean) => void;
};

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      activeId: null,
      sort: "opened",
      exportHistory: false,
      setActive: (activeId) => set({ activeId }),
      setSort: (sort) => set({ sort }),
      setExportHistory: (exportHistory) => set({ exportHistory }),
    }),
    { name: "designhub:project", version: 1, storage: createJSONStorage(() => indexedDbStorage) },
  ),
);
