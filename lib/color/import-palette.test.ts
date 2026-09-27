import assert from "node:assert/strict";
import { test } from "node:test";

import { toHex } from "@/lib/color/color";
import { parsePaletteImport } from "@/lib/color/import-palette";

test("parses a Coolors palette URL", () => {
  const result = parsePaletteImport("https://coolors.co/264653-2a9d8f-e9c46a-f4a261-e76f51");

  assert.deepEqual(result.colors.map(toHex), [
    "#264653",
    "#2a9d8f",
    "#e9c46a",
    "#f4a261",
    "#e76f51",
  ]);
  assert.equal(result.dropped, 0);
});

test("parses the Coolors palette URL format", () => {
  const result = parsePaletteImport("https://coolors.co/palette/264653-2a9d8f-e9c46a");

  assert.deepEqual(result.colors.map(toHex), ["#264653", "#2a9d8f", "#e9c46a"]);
  assert.equal(result.dropped, 0);
});

test("parses hex codes from surrounding text", () => {
  const result = parsePaletteImport("Primary: #264653, accent #2a9d8f and highlight #e9c46a.");

  assert.deepEqual(result.colors.map(toHex), ["#264653", "#2a9d8f", "#e9c46a"]);
});

test("accepts three digit hex codes", () => {
  const result = parsePaletteImport("#abc, #def");

  assert.deepEqual(result.colors.map(toHex), ["#aabbcc", "#ddeeff"]);
});

test("drops colors after the maximum", () => {
  const result = parsePaletteImport(
    "#000000 #111111 #222222 #333333 #444444 #555555 #666666 #777777 #888888 #999999 #aaaaaa",
  );

  assert.equal(result.colors.length, 10);
  assert.equal(result.dropped, 1);
});

test("returns no colors when the input has no hex codes", () => {
  const result = parsePaletteImport("not a palette");

  assert.deepEqual(result.colors, []);
  assert.equal(result.dropped, 0);
});
