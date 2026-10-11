import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { fromHex } from "@/lib/color/color";
import { randomPalette } from "@/lib/color/generate";
import { defaultGradient } from "@/lib/color/gradient";
import { starterPalette } from "@/lib/color/presets";
import { defaultShadeOptions, type ShadeOptions } from "@/lib/color/shades";
import { indexedDbStorage } from "@/lib/db";
import { createId } from "@/lib/id";
import type { ColorFormat, Gradient, HarmonyMode, Oklch, Swatch } from "@/types/color";

export const MIN_SWATCHES = 2;
export const MAX_SWATCHES = 10;

export function createSwatch(color: Oklch, locked = false): Swatch {
  return { id: createId("sw"), color, locked };
}

export type ColorTab = "palette" | "shades" | "gradient" | "contrast" | "export";

type ColorState = {
  tab: ColorTab;
  swatches: Swatch[];
  selectedId: string | null;
  format: ColorFormat;
  harmony: HarmonyMode;
  setHarmony: (harmony: HarmonyMode) => void;
  shadeOptions: ShadeOptions;
  setShadeOptions: (patch: Partial<ShadeOptions>) => void;
  contrast: { fg: Oklch; bg: Oklch };
  setContrast: (patch: Partial<{ fg: Oklch; bg: Oklch }>) => void;
  gradient: Gradient;
  setGradient: (gradient: Gradient) => void;
  updateGradient: (patch: Partial<Gradient>) => void;
  setTab: (tab: ColorTab) => void;
  setFormat: (format: ColorFormat) => void;
  select: (id: string) => void;
  updateColor: (id: string, color: Oklch) => void;
  toggleLock: (id: string) => void;
  addSwatch: (color: Oklch, afterId?: string) => void;
  removeSwatch: (id: string) => void;
  moveSwatch: (id: string, direction: -1 | 1) => void;
  setSwatches: (swatches: Swatch[]) => void;
  past: Swatch[][];
  future: Swatch[][];
  /** Regenerates every unlocked swatch. `colors` lets callers supply a harmony. */
  generate: (colors?: Oklch[]) => void;
  undo: () => void;
  redo: () => void;
};

const HISTORY_LIMIT = 50;

export const useColorStore = create<ColorState>()(
  persist(
    (set) => ({
      tab: "palette",
      swatches: starterPalette.map((hex) => createSwatch(fromHex(hex))),
      selectedId: null,
      format: "hex",
      harmony: "random",
      setHarmony: (harmony) => set({ harmony }),
      shadeOptions: defaultShadeOptions,
      setShadeOptions: (patch) => set((state) => ({ shadeOptions: { ...state.shadeOptions, ...patch } })),
      contrast: { fg: fromHex("#0f172a"), bg: fromHex("#ffc935") },
      setContrast: (patch) => set((state) => ({ contrast: { ...state.contrast, ...patch } })),
      gradient: defaultGradient,
      setGradient: (gradient) => set({ gradient }),
      updateGradient: (patch) => set((state) => ({ gradient: { ...state.gradient, ...patch } })),
      setTab: (tab) => set({ tab }),
      setFormat: (format) => set({ format }),
      select: (id) => set({ selectedId: id }),
      updateColor: (id, color) =>
        set((state) => ({
          swatches: state.swatches.map((swatch) => (swatch.id === id ? { ...swatch, color } : swatch)),
        })),
      toggleLock: (id) =>
        set((state) => ({
          swatches: state.swatches.map((swatch) => (swatch.id === id ? { ...swatch, locked: !swatch.locked } : swatch)),
        })),
      addSwatch: (color, afterId) =>
        set((state) => {
          if (state.swatches.length >= MAX_SWATCHES) return state;
          const swatch = createSwatch(color);
          const index = afterId ? state.swatches.findIndex((item) => item.id === afterId) : -1;
          const swatches = [...state.swatches];
          swatches.splice(index === -1 ? swatches.length : index + 1, 0, swatch);
          return { swatches, selectedId: swatch.id };
        }),
      removeSwatch: (id) =>
        set((state) => {
          if (state.swatches.length <= MIN_SWATCHES) return state;
          return {
            swatches: state.swatches.filter((swatch) => swatch.id !== id),
            selectedId: state.selectedId === id ? null : state.selectedId,
          };
        }),
      moveSwatch: (id, direction) =>
        set((state) => {
          const index = state.swatches.findIndex((swatch) => swatch.id === id);
          const target = index + direction;
          if (index === -1 || target < 0 || target >= state.swatches.length) return state;
          const swatches = [...state.swatches];
          const [moved] = swatches.splice(index, 1);
          if (moved) swatches.splice(target, 0, moved);
          return { swatches };
        }),
      setSwatches: (swatches) =>
        set((state) => ({ swatches, past: [...state.past, state.swatches].slice(-HISTORY_LIMIT), future: [] })),
      past: [],
      future: [],
      generate: (colors) =>
        set((state) => {
          const fresh = colors ?? randomPalette(state.swatches.length);
          const swatches = state.swatches.map((swatch, index) =>
            swatch.locked ? swatch : { ...swatch, color: fresh[index] ?? swatch.color },
          );
          return { swatches, past: [...state.past, state.swatches].slice(-HISTORY_LIMIT), future: [] };
        }),
      undo: () =>
        set((state) => {
          const previous = state.past[state.past.length - 1];
          if (!previous) return state;
          return { swatches: previous, past: state.past.slice(0, -1), future: [state.swatches, ...state.future] };
        }),
      redo: () =>
        set((state) => {
          const [next, ...future] = state.future;
          if (!next) return state;
          return { swatches: next, past: [...state.past, state.swatches], future };
        }),
    }),
    {
      name: "designhub:colors",
      version: 1,
      storage: createJSONStorage(() => indexedDbStorage),
      partialize: ({ swatches, selectedId, format, harmony, shadeOptions, gradient, contrast }) => ({
        contrast,
        swatches,
        selectedId,
        format,
        harmony,
        shadeOptions,
        gradient,
      }),
    },
  ),
);

/** The selected swatch, falling back to the first one. */
export function useSelectedSwatch(): Swatch | undefined {
  return useColorStore((state) => state.swatches.find((swatch) => swatch.id === state.selectedId) ?? state.swatches[0]);
}
