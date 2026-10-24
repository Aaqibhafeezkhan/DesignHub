import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import { renderBackgroundSvg, backgroundGenerators } from "@/lib/background/registry";
import { defaultBackground } from "@/store/background-store";
import type { BackgroundKind, BackgroundSettings } from "@/types/background";

/**
 * A golden SVG for every generator, and for every look of a generator that has several, so a change to
 * how a background is drawn shows up in review. Generators are seeded, so the same settings always
 * draw the same SVG. To accept an intended change, run `pnpm vitest run lib/background -u` and read the
 * diff of the snapshot files like any other change; a new generator gets its files the same way.
 */
const DIR = join(__dirname, "__snapshots__");

/** Fixed settings: seed 42, the default palette, a small canvas, and the generator's own starting values. */
function fixed(kind: BackgroundKind, variant: string | undefined, rotation: number): BackgroundSettings {
  const generator = backgroundGenerators.find((item) => item.kind === kind)!;
  const look = generator.variants?.find((item) => item.variant === variant);
  return {
    ...defaultBackground,
    ...generator.defaults,
    ...look?.defaults,
    kind,
    seed: 42,
    width: 400,
    height: 300,
    rotation,
    options: variant ? { variant: look!.variant } : {},
  };
}

/** Every look to pin: each generator once, or once per variant. */
type Look = { name: string; kind: BackgroundKind; variant: string | undefined };
const looks: Look[] = [];
for (const generator of backgroundGenerators) {
  if (!generator.variants) looks.push({ name: generator.kind, kind: generator.kind, variant: undefined });
  for (const variant of generator.variants ?? []) {
    looks.push({ name: `${generator.kind}-${variant.variant}`, kind: generator.kind, variant: variant.variant });
  }
}

describe.each(looks)("snapshot $name", ({ name, kind, variant }) => {
  test.each([0, 30])("rotation %i matches the committed SVG", async (rotation) => {
    await expect(renderBackgroundSvg(fixed(kind, variant, rotation))).toMatchFileSnapshot(
      `./__snapshots__/${name}.rot${rotation}.svg`,
    );
  });

  test("is deterministic: no clock or random number in a drawing", () => {
    expect(renderBackgroundSvg(fixed(kind, variant, 0))).toBe(renderBackgroundSvg(fixed(kind, variant, 0)));
  });
});

describe("the snapshot folder", () => {
  test("has a file for every look and rotation, and nothing left over from a removed generator", () => {
    const expected = looks.flatMap((look) => [0, 30].map((rotation) => `${look.name}.rot${rotation}.svg`));
    expect(readdirSync(DIR).sort()).toEqual(expected.sort());
  });

  test("stays small enough to review", () => {
    const bytes = readdirSync(DIR).reduce((sum, file) => sum + statSync(join(DIR, file)).size, 0);
    expect(bytes).toBeLessThan(1_000_000);
  });
});
