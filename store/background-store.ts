import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { migrateBackgroundSettings } from "@/lib/background/aliases";
import { randomSeed } from "@/lib/background/random";
import { indexedDbStorage } from "@/lib/db";
import type {
  BackgroundDefinition,
  BackgroundKind,
  BackgroundOptions,
  BackgroundSettings,
  BackgroundVariantDefinition,
} from "@/types/background";

export const defaultBackground: BackgroundSettings = {
  kind: "waves",
  seed: 1337,
  colors: ["#6366f1", "#f472b6", "#fbbf24"],
  background: "#0e0e10",
  density: 50,
  scale: 1,
  rotation: 0,
  width: 1600,
  height: 900,
  options: {},
};

type BackgroundState = {
  settings: BackgroundSettings;
  update: (patch: Partial<BackgroundSettings>) => void;
  /** Merges into the generator-specific options, keeping the ones not in the patch. */
  updateOptions: (patch: Partial<BackgroundOptions>) => void;
  setKind: (kind: BackgroundKind, definition?: BackgroundDefinition) => void;
  /** Picks a look inside a generator that has several, with that look's starting values. */
  setVariant: (variant: BackgroundVariantDefinition) => void;
  randomize: () => void;
  setColor: (index: number, color: string) => void;
  addColor: (color: string) => void;
  removeColor: (index: number) => void;
  reset: () => void;
};

export const MAX_BACKGROUND_COLORS = 6;

export const useBackgroundStore = create<BackgroundState>()(
  persist(
    (set) => ({
      settings: defaultBackground,
      update: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
      updateOptions: (patch) =>
        set((state) => ({ settings: { ...state.settings, options: { ...state.settings.options, ...patch } } })),
      setKind: (kind, definition) =>
        set((state) => {
          // A variant belongs to one generator, so switching generators starts from its first look.
          const options = { ...state.settings.options };
          delete options.variant;
          return { settings: { ...state.settings, ...definition?.defaults, kind, options } };
        }),
      setVariant: (variant) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ...variant.defaults,
            options: { ...state.settings.options, variant: variant.variant },
          },
        })),
      randomize: () => set((state) => ({ settings: { ...state.settings, seed: randomSeed() } })),
      setColor: (index, color) =>
        set((state) => ({
          settings: { ...state.settings, colors: state.settings.colors.map((item, i) => (i === index ? color : item)) },
        })),
      addColor: (color) =>
        set((state) =>
          state.settings.colors.length >= MAX_BACKGROUND_COLORS
            ? state
            : { settings: { ...state.settings, colors: [...state.settings.colors, color] } },
        ),
      removeColor: (index) =>
        set((state) =>
          state.settings.colors.length <= 1
            ? state
            : { settings: { ...state.settings, colors: state.settings.colors.filter((_, i) => i !== index) } },
        ),
      reset: () => set({ settings: defaultBackground }),
    }),
    {
      name: "designhub:backgrounds",
      version: 3,
      storage: createJSONStorage(() => indexedDbStorage),
      // v1 had no generator options and v2 had nine looks that are variants now; the merge below fills anything
      // missing from the defaults and maps an old kind to its merged generator.
      migrate: (persisted) => persisted as BackgroundState,
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<BackgroundState>;
        return {
          ...current,
          ...saved,
          settings: migrateBackgroundSettings({
            ...current.settings,
            ...saved.settings,
            options: { ...current.settings.options, ...saved.settings?.options },
          }),
        };
      },
    },
  ),
);
