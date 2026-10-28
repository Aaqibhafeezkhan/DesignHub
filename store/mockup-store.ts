import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { indexedDbStorage } from "@/lib/db";
import type { MockupContent } from "@/lib/mockups/types";
import type { BrandMode } from "@/types/brand";

/** Empty fields fall back to values derived from the brand (see useMockupContext). */
const defaultMockupContent: MockupContent = {
  person: "Jordan Lee",
  role: "Head of Design",
  email: "",
  phone: "+1 (555) 010-2030",
  website: "",
  address: "100 Market Street, San Francisco",
  headline: "",
  cta: "Get started",
};

type MockupState = {
  template: string;
  mode: BrandMode;
  content: MockupContent;
  scale: number;
  setTemplate: (template: string) => void;
  setMode: (mode: BrandMode) => void;
  setContent: (patch: Partial<MockupContent>) => void;
  setScale: (scale: number) => void;
};

export const useMockupStore = create<MockupState>()(
  persist(
    (set) => ({
      template: "business-card",
      mode: "light",
      content: defaultMockupContent,
      scale: 2,
      setTemplate: (template) => set({ template }),
      setMode: (mode) => set({ mode }),
      setContent: (patch) => set((state) => ({ content: { ...state.content, ...patch } })),
      setScale: (scale) => set({ scale }),
    }),
    { name: "designhub:mockups", version: 1, storage: createJSONStorage(() => indexedDbStorage) },
  ),
);
