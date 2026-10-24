import { useBrandStore } from "@/store/brand-store";
import { useColorStore } from "@/store/color-store";
import { useEffectsStore } from "@/store/effects-store";
import { useLogoStore } from "@/store/logo-store";
import { useMockupStore } from "@/store/mockup-store";
import { useSocialStore } from "@/store/social-store";
import { useTokensStore } from "@/store/tokens-store";
import { useTypographyStore } from "@/store/typography-store";

type State<T extends { getState: () => unknown }> = ReturnType<T["getState"]>;

/**
 * Everything that defines one brand. The live stores stay the single source of truth;
 * a snapshot is only written when a project is saved and read when it is opened.
 */
export type BrandSnapshot = {
  version: 2;
  brand: Pick<State<typeof useBrandStore>, "profile">;
  colors: Pick<State<typeof useColorStore>, "swatches" | "shadeOptions" | "gradient">;
  typography: Pick<State<typeof useTypographyStore>, "headingFont" | "bodyFont" | "scale" | "rhythm">;
  tokens: Pick<State<typeof useTokensStore>, "settings">;
  effects: Pick<State<typeof useEffectsStore>, "settings">;
  logo: Pick<State<typeof useLogoStore>, "clearSpace">;
  mockups: Pick<State<typeof useMockupStore>, "content" | "mode">;
  social: Pick<State<typeof useSocialStore>, "content" | "mode" | "design" | "packSelection">;
};

/** The stores a snapshot covers, used to capture, restore and watch for edits. */
const stores = [
  useBrandStore,
  useColorStore,
  useTypographyStore,
  useTokensStore,
  useEffectsStore,
  useLogoStore,
  useMockupStore,
  useSocialStore,
] as const;

function slices(source: {
  brand: State<typeof useBrandStore>;
  colors: State<typeof useColorStore>;
  typography: State<typeof useTypographyStore>;
  tokens: State<typeof useTokensStore>;
  effects: State<typeof useEffectsStore>;
  logo: State<typeof useLogoStore>;
  mockups: State<typeof useMockupStore>;
  social: State<typeof useSocialStore>;
}): BrandSnapshot {
  const { brand, colors, typography, tokens, effects, logo, mockups, social } = source;
  return structuredClone({
    version: 2,
    brand: { profile: brand.profile },
    colors: { swatches: colors.swatches, shadeOptions: colors.shadeOptions, gradient: colors.gradient },
    typography: {
      headingFont: typography.headingFont,
      bodyFont: typography.bodyFont,
      scale: typography.scale,
      rhythm: typography.rhythm,
    },
    tokens: { settings: tokens.settings },
    effects: { settings: effects.settings },
    logo: { clearSpace: logo.clearSpace },
    mockups: { content: mockups.content, mode: mockups.mode },
    social: { content: social.content, mode: social.mode, design: social.design, packSelection: social.packSelection },
  });
}

export function captureSnapshot(): BrandSnapshot {
  return slices({
    brand: useBrandStore.getState(),
    colors: useColorStore.getState(),
    typography: useTypographyStore.getState(),
    tokens: useTokensStore.getState(),
    effects: useEffectsStore.getState(),
    logo: useLogoStore.getState(),
    mockups: useMockupStore.getState(),
    social: useSocialStore.getState(),
  });
}

/** A fresh brand: every store's initial state. */
export function defaultSnapshot(name?: string): BrandSnapshot {
  const snapshot = slices({
    brand: useBrandStore.getInitialState(),
    colors: useColorStore.getInitialState(),
    typography: useTypographyStore.getInitialState(),
    tokens: useTokensStore.getInitialState(),
    effects: useEffectsStore.getInitialState(),
    logo: useLogoStore.getInitialState(),
    mockups: useMockupStore.getInitialState(),
    social: useSocialStore.getInitialState(),
  });
  if (name) snapshot.brand.profile.name = name;
  return snapshot;
}

/** Moves the local palette cursor when a global restore revisits one of its states. */
function restoredColorHistory(swatches: BrandSnapshot["colors"]["swatches"]) {
  const { past, future, swatches: current } = useColorStore.getState();
  const value = JSON.stringify(swatches);
  const matches = (palette: typeof swatches) => JSON.stringify(palette) === value;
  if (matches(current)) return { past, future };
  const previous = past.findLastIndex(matches);
  if (previous !== -1) {
    return {
      past: past.slice(0, previous),
      future: [...past.slice(previous + 1), current, ...future],
    };
  }
  const next = future.findIndex(matches);
  if (next !== -1) {
    return {
      past: [...past, current, ...future.slice(0, next)],
      future: future.slice(next + 1),
    };
  }
  // Direct color edits can be global steps without being local palette steps.
  return { past, future };
}

/** Loads a snapshot. Project/version restores reset palette history; global history retains it. */
export function applySnapshot(snapshot: BrandSnapshot, options: { preserveColorHistory?: boolean } = {}): void {
  const base = defaultSnapshot();
  const data = structuredClone(snapshot);
  const colors = { ...base.colors, ...data.colors };
  useBrandStore.setState({ profile: { ...base.brand.profile, ...data.brand.profile } });
  useColorStore.setState({
    ...colors,
    selectedId: null,
    ...(options.preserveColorHistory ? restoredColorHistory(colors.swatches) : { past: [], future: [] }),
  });
  useTypographyStore.setState({ ...base.typography, ...data.typography });
  useTokensStore.setState({ settings: { ...base.tokens.settings, ...data.tokens.settings } });
  useEffectsStore.setState({ settings: { ...base.effects.settings, ...data.effects.settings } });
  useLogoStore.setState({ ...base.logo, ...data.logo });
  useMockupStore.setState({ content: { ...base.mockups.content, ...data.mockups.content }, mode: data.mockups.mode });
  useSocialStore.setState({
    content: { ...base.social.content, ...data.social.content },
    mode: data.social.mode,
    design: { ...base.social.design, ...data.social.design },
    packSelection: data.social.packSelection ?? null,
  });
}

/** True once every covered store has loaded its saved state. */
export function snapshotStoresHydrated(): boolean {
  return stores.every((store) => store.persist.hasHydrated());
}

/** Resolves when every covered store has hydrated. */
export function whenSnapshotStoresHydrated(): Promise<void> {
  return Promise.all(
    stores.map(
      (store) =>
        new Promise<void>((resolve) => {
          if (store.persist.hasHydrated()) resolve();
          else {
            const off = store.persist.onFinishHydration(() => {
              off();
              resolve();
            });
          }
        }),
    ),
  ).then(() => undefined);
}

/** Calls `listener` whenever any brand-defining store changes. */
export function subscribeToSnapshot(listener: () => void): () => void {
  const offs = stores.map((store) => store.subscribe(listener));
  return () => offs.forEach((off) => off());
}
