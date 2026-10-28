import { readdirSync } from "node:fs";
import { join } from "node:path";

import { clearIDCache } from "@iconify/utils";
import { describe, expect, test } from "vitest";

import { iconExports } from "@/lib/icons/export";
import { defaultIconStyle } from "@/lib/icons/svg";
import type { IconData, IconId, IconStyle } from "@/types/icons";

/**
 * Every icon export, byte for byte, for three icons and two styles. Grouping the formats in the picker, or
 * moving a helper they share, must not change a single character of any of them. A change on purpose shows
 * up as a diff of these files: accept it with `pnpm vitest run lib/icons -u` and read the diff like any
 * other change.
 *
 * The icons turn on the branches a plain line icon leaves alone: a stroke icon that takes the style's color
 * and stroke width, and an icon with a gradient, a `<style>` block, braces, backticks, `${}` and `{{ }}`,
 * which the framework formats each escape their own way. The ids made unique for the gradient carry a
 * counter (fade, fade1, ...) that follows the order of the formats, so a new format that renames ids shifts
 * the numbers after it.
 */
const DIR = join(__dirname, "__snapshots__");

const ID: IconId = "tabler:brand-github";

const line: IconData = {
  body: '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M4 12h16M12 4v16"/>',
  width: 24,
  height: 24,
};

const tricky: IconData = {
  body:
    '<defs><linearGradient id="fade"><stop offset="0" stop-color="#f00"/><stop offset="1" stop-color="#00f"/></linearGradient></defs>' +
    "<style>@media print{.a{fill:red}}</style>" +
    '<path class="a" fill="url(#fade)" stroke="currentColor" d="M0 0h24v24H0z"/>' +
    '<use xlink:href="#fade"/>' +
    "<text>`${x}` \\ {{ y }}</text>",
  width: 32,
  height: 24,
  left: 2,
  top: 1,
};

const styled: IconStyle = {
  ...defaultIconStyle,
  size: 64,
  color: "#ef4444",
  strokeWidth: 3,
  corners: "rounded",
  rotate: 90,
  flipH: true,
  padding: 10,
  background: { shape: "rounded", color: "#6366f1" },
};

const cases = [
  { name: "line", icon: line, style: defaultIconStyle },
  { name: "line-styled", icon: line, style: styled },
  { name: "tricky", icon: tricky, style: defaultIconStyle },
] as const;

/**
 * Unique ids come from a counter that lives as long as the process, so each case starts it from zero. The
 * same icon then gives the same text whatever test ran before it.
 */
function build(icon: IconData, style: IconStyle) {
  clearIDCache();
  return iconExports(ID, icon, style);
}

/** One file per format and case. `.txt` is added so no tool mistakes a snapshot for source. */
const fileFor = (set: string, id: string, filename: string) => `${set}.${id}.${filename}.txt`;

describe.each(cases)("icon exports ($name)", ({ name, icon, style }) => {
  const formats = build(icon, style);

  test.each(formats.map((format) => [format.id, format] as const))("%s is unchanged", async (_id, format) => {
    await expect(format.code).toMatchFileSnapshot(`./__snapshots__/${fileFor(name, format.id, format.filename)}`);
  });
});

describe("the icon snapshot folder", () => {
  test("has a file for every format and case, and nothing left from a removed format", () => {
    const expected = cases.flatMap(({ name, icon, style }) =>
      build(icon, style).map((format) => fileFor(name, format.id, format.filename)),
    );
    expect(readdirSync(DIR).sort()).toEqual(expected.sort());
  });

  test("builds the same text twice: no clock or random value in a format", () => {
    for (const { icon, style } of cases) {
      const first = build(icon, style).map((format) => format.code);
      const second = build(icon, style).map((format) => format.code);
      expect(second).toEqual(first);
    }
  });
});
