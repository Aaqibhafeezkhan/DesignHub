import { readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import { defaultSnapshot } from "@/lib/projects/snapshot";
import { tokensFromSnapshot } from "@/lib/tokens/from-snapshot";
import { tokenFormats } from "@/lib/tokens/formats";
import { loadFontCatalog } from "@/lib/typography/catalog";
import type { DesignTokens } from "@/types/tokens";

/**
 * Every token format, byte for byte, for the default brand with a fixed time. The CLI promises
 * deterministic files, so a refactor of the generators (or a change to a helper they share) must not
 * change a single character of any of them. A change on purpose shows up as a diff of these files:
 * accept it with `pnpm vitest run lib/tokens -u` and read the diff like any other change.
 *
 * Two token sets run through every format: the default one, and one that turns on the branches the
 * first leaves alone (a prefix, another color notation, no typography, no gradient).
 */
const DIR = join(__dirname, "__snapshots__");
const GENERATED_AT = new Date(0).toISOString();

const catalog = await loadFontCatalog();
const standard = tokensFromSnapshot(defaultSnapshot("Acme Labs"), catalog, GENERATED_AT);
const variant: DesignTokens = {
  ...standard,
  meta: { ...standard.meta, prefix: "acme", colorFormat: "hsl" },
  typography: null,
  gradient: null,
};

const sets = [
  { name: "standard", tokens: standard },
  { name: "variant", tokens: variant },
] as const;

/**
 * One file per format and token set. The format's own file name is kept for readability, and `.txt` is
 * added so no tool mistakes a snapshot for source: tsc, ESLint and Prettier must leave them alone.
 */
const fileFor = (set: string, id: string, filename: string) => `${set}.${id}.${filename.replace(/[\\/]/g, "_")}.txt`;

describe.each(sets)("token formats ($name tokens)", ({ name, tokens }) => {
  const formats = tokenFormats(tokens);

  test.each(formats.map((format) => [format.id, format] as const))("%s is unchanged", async (_id, format) => {
    await expect(format.code).toMatchFileSnapshot(`./__snapshots__/${fileFor(name, format.id, format.filename)}`);
  });
});

describe("the snapshot folder", () => {
  test("has a file for every format and token set, and nothing left from a removed format", () => {
    const expected = sets.flatMap(({ name, tokens }) =>
      tokenFormats(tokens).map((format) => fileFor(name, format.id, format.filename)),
    );
    expect(readdirSync(DIR).sort()).toEqual(expected.sort());
  });

  test("builds the same text twice: no clock or random value in a format", () => {
    for (const { tokens } of sets) {
      const first = tokenFormats(tokens).map((format) => format.code);
      const second = tokenFormats(tokens).map((format) => format.code);
      expect(second).toEqual(first);
    }
  });
});
