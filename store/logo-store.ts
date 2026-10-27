import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { indexedDbStorage } from "@/lib/db";
import type { LogoVariantId } from "@/lib/logo/variants";

export type LogoBackdrop = "light" | "dark" | "brand" | "checker";

type LogoGuides = { grid: boolean; clearSpace: boolean; safeArea: boolean };

/** View preferences only. The logo itself belongs to the brand profile. */
type LogoState = {
  backdrop: LogoBackdrop;
  guides: LogoGuides;
  /** Clear space as a fraction of the logo's height. */
  clearSpace: number;
  variant: LogoVariantId;
  setVariant: (variant: LogoVariantId) => void;
  setBackdrop: (backdrop: LogoBackdrop) => void;
  toggleGuide: (guide: keyof LogoGuides) => void;
  setClearSpace: (value: number) => void;
};

export const useLogoStore = create<LogoState>()(
  persist(
    (set) => ({
      backdrop: "checker",
      guides: { grid: false, clearSpace: false, safeArea: false },
      clearSpace: 0.25,
      variant: "color",
      setVariant: (variant) => set({ variant }),
      setBackdrop: (backdrop) => set({ backdrop }),
      toggleGuide: (guide) => set((state) => ({ guides: { ...state.guides, [guide]: !state.guides[guide] } })),
      setClearSpace: (clearSpace) => set({ clearSpace }),
    }),
    { name: "designhub:logo", version: 1, storage: createJSONStorage(() => indexedDbStorage) },
  ),
);
