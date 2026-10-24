import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import { legacyKinds, migrateBackgroundSettings } from "@/lib/background/aliases";
import { backgroundCss } from "@/lib/background/export";
import { variantOf } from "@/lib/background/family";
import { backgroundGenerators, getGenerator, renderBackgroundSvg } from "@/lib/background/registry";
import { useBackgroundStore, defaultBackground } from "@/store/background-store";
import type { BackgroundSettings } from "@/types/background";

/**
 * Output of the nine generators before they were merged into concentric, woven and zigzag, kept as
 * fixtures: a merged look must draw exactly what its old generator drew, with the same seed and settings.
 */
const FIXTURES = join(__dirname, "__fixtures__", "legacy");
const fixture = (name: string) => readFileSync(join(FIXTURES, name), "utf8");

/** The settings the old fixtures were rendered with, for an old kind. */
function oldSettings(kind: string, name: "default" | "tuned"): BackgroundSettings {
  const family = legacyKinds[kind]!;
  const variant = getGenerator(family.kind)!.variants!.find((item) => item.variant === family.variant)!;
  const base = { ...defaultBackground, ...variant.defaults, kind, width: 640, height: 360 };
  return migrateBackgroundSettings(
    name === "default"
      ? { ...base, seed: 42 }
      : { ...base, seed: 7, rotation: 30, density: 70, scale: 1.5, colors: ["#112233", "#44aa88"] },
  );
}

describe.each(Object.keys(legacyKinds))("old kind %s", (kind) => {
  test.each(["default", "tuned"] as const)("draws the same SVG as before it was merged (%s)", (name) => {
    expect(renderBackgroundSvg(oldSettings(kind, name))).toBe(fixture(`${kind}.${name}.svg`));
  });

  test.each(["default", "tuned"] as const)("exports the same CSS as before it was merged (%s)", (name) => {
    expect(backgroundCss(oldSettings(kind, name))).toBe(fixture(`${kind}.${name}.css`));
  });

  test("loads as the merged generator with the matching variant", () => {
    const loaded = migrateBackgroundSettings({ ...defaultBackground, kind });
    expect(loaded.kind).toBe(legacyKinds[kind]!.kind);
    expect(loaded.options?.variant).toBe(legacyKinds[kind]!.variant);
    expect(getGenerator(loaded.kind)).toBeDefined();
  });
});

describe("the merged generators", () => {
  test("replace nine generators with three, and no old kind stays in the registry", () => {
    const kinds = backgroundGenerators.map((generator) => generator.kind as string);
    for (const old of ["rings", "arcs", "squares", "argyle", "plaid", "checks", "chevron", "squiggle"]) {
      expect(kinds, old).not.toContain(old);
    }
    expect(kinds).toEqual(expect.arrayContaining(["concentric", "woven", "zigzag"]));
    expect(backgroundGenerators).toHaveLength(33);
    expect(new Set(kinds).size).toBe(kinds.length);
  });

  test.each(["concentric", "woven", "zigzag"] as const)("%s has three looks that draw differently", (kind) => {
    const generator = getGenerator(kind)!;
    expect(generator.variants).toHaveLength(3);
    const drawings = generator.variants!.map((variant) =>
      renderBackgroundSvg({ ...defaultBackground, kind, options: { variant: variant.variant } }),
    );
    expect(new Set(drawings).size).toBe(3);
  });

  test("a missing or foreign variant falls back to the first look", () => {
    const woven = getGenerator("woven")!;
    expect(variantOf({ options: {} }, woven.variants!).variant).toBe("checks");
    expect(variantOf({ options: { variant: "rings" } }, woven.variants!).variant).toBe("checks");
    expect(variantOf({ options: { variant: "plaid" } }, woven.variants!).variant).toBe("plaid");
  });

  test("a look keeps its native CSS when it has one", () => {
    const css = backgroundCss({ ...defaultBackground, kind: "woven", options: { variant: "checks" } });
    expect(css).toContain("repeating-conic-gradient");
    expect(backgroundCss({ ...defaultBackground, kind: "woven", options: { variant: "plaid" } })).toContain(
      "data:image/svg+xml",
    );
  });

  test("a migrated background is not changed again", () => {
    const once = migrateBackgroundSettings({ ...defaultBackground, kind: "arcs" });
    expect(migrateBackgroundSettings(once)).toEqual(once);
    // A saved variant wins over the one the old kind implies.
    expect(
      migrateBackgroundSettings({ ...once, kind: "rings", options: { variant: "squares" } }).options?.variant,
    ).toBe("squares");
  });
});

describe("the background store", () => {
  test("a saved background with an old kind loads as the merged generator", () => {
    const { merge } = useBackgroundStore.persist.getOptions();
    for (const kind of Object.keys(legacyKinds)) {
      const loaded = merge!({ settings: { ...defaultBackground, kind } }, useBackgroundStore.getInitialState());
      expect(loaded.settings.kind, kind).toBe(legacyKinds[kind]!.kind);
      expect(loaded.settings.options?.variant, kind).toBe(legacyKinds[kind]!.variant);
    }
  });

  test("keeps the other saved options and fills what an old version did not have", () => {
    const { merge } = useBackgroundStore.persist.getOptions();
    const loaded = merge!(
      { settings: { kind: "halftone", seed: 9, options: { halftoneGradient: "radial" } } },
      useBackgroundStore.getInitialState(),
    );
    expect(loaded.settings).toMatchObject({ kind: "halftone", seed: 9, options: { halftoneGradient: "radial" } });
    expect(loaded.settings.colors.length).toBeGreaterThan(0);
  });

  test("switching generator drops the variant, and picking a look sets it with its own defaults", () => {
    const store = useBackgroundStore;
    const woven = getGenerator("woven")!;
    store.getState().setKind("woven", woven);
    expect(store.getState().settings.options?.variant).toBeUndefined();
    const squiggle = getGenerator("zigzag")!.variants!.find((item) => item.variant === "squiggle")!;
    store.getState().setKind("zigzag", getGenerator("zigzag"));
    store.getState().setVariant(squiggle);
    expect(store.getState().settings).toMatchObject({ options: { variant: "squiggle" }, density: 52, scale: 1.5 });
    store.getState().setKind("woven", woven);
    expect(store.getState().settings.options?.variant).toBeUndefined();
    store.getState().reset();
  });
});
