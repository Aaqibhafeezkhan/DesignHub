import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { indexedDbStorage } from "@/lib/db";
import type { TokenSections, TokenSettings } from "@/types/tokens";

export const defaultTokenSettings: TokenSettings = {
  name: "My Design System",
  prefix: "",
  colorFormat: "oklch",
  spacingBase: 8,
  radiusBase: 12,
  sections: {
    colors: true,
    shades: true,
    gradient: true,
    typography: true,
    spacing: true,
    radius: true,
    effects: true,
  },
};

type TokensState = {
  settings: TokenSettings;
  /** The format open in the Export Engine. A view choice, not part of a project, so it is outside `settings`. */
  openFormat: string | null;
  setOpenFormat: (id: string | null) => void;
  update: (patch: Partial<TokenSettings>) => void;
  toggleSection: (section: keyof TokenSections) => void;
  reset: () => void;
};

export const useTokensStore = create<TokensState>()(
  persist(
    (set) => ({
      settings: defaultTokenSettings,
      openFormat: null,
      setOpenFormat: (openFormat) => set({ openFormat }),
      update: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
      toggleSection: (section) =>
        set((state) => ({
          settings: {
            ...state.settings,
            sections: { ...state.settings.sections, [section]: !state.settings.sections[section] },
          },
        })),
      reset: () => set({ settings: defaultTokenSettings }),
    }),
    { name: "designhub:tokens", version: 1, storage: createJSONStorage(() => indexedDbStorage) },
  ),
);
