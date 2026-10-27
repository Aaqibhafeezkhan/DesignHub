import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import { allMockupTemplates as mockupTemplates } from "@/lib/mockups/all";
import { allSocialTemplates as socialTemplates } from "@/lib/social/all";
import { mockupContext, socialContext } from "@/lib/test/draw-context";
import type { BrandMode } from "@/types/brand";

/**
 * A golden SVG for every social template and mockup, for the default brand in light and dark, so a
 * change to how one looks shows up in review. The drawings are pure functions of the brand, and the test
 * context measures text with a font-free estimate, so the files do not depend on a browser or a font.
 * To accept an intended change, run `pnpm vitest run lib/social -u` and read the diff of the files like any
 * other change; a new template gets its two files the same way.
 */
const DIR = join(__dirname, "__snapshots__");
const MODES: BrandMode[] = ["light", "dark"];
/** One snapshot should stay reviewable. */
const MAX_BYTES = 200_000;

const items = [
  ...socialTemplates.map((template) => ({
    id: `social-${template.id}`,
    render: (mode: BrandMode) => template.render(socialContext(mode)),
  })),
  ...mockupTemplates.map((template) => ({
    id: `mockup-${template.id}`,
    render: (mode: BrandMode) => template.render(mockupContext(mode)),
  })),
];

describe.each(items)("snapshot $id", ({ id, render }) => {
  test.each(MODES)("%s matches the committed SVG", async (mode) => {
    const svg = render(mode);
    await expect(svg).toMatchFileSnapshot(`./__snapshots__/${id}.${mode}.svg`);
    expect(Buffer.byteLength(svg), `${id} (${mode}) is too large to review`).toBeLessThan(MAX_BYTES);
  });
});

describe("the snapshot folder", () => {
  test("has a light and a dark file for every template and mockup, and nothing left from a removed one", () => {
    const expected = items.flatMap((item) => MODES.map((mode) => `${item.id}.${mode}.svg`));
    expect(readdirSync(DIR).sort()).toEqual(expected.sort());
  });

  test("template ids are unique across social and mockup files", () => {
    const ids = items.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

test("the snapshots add up to a size the repository can carry", () => {
  const bytes = readdirSync(DIR).reduce((sum, file) => sum + statSync(join(DIR, file)).size, 0);
  expect(bytes).toBeLessThan(8_000_000);
});
