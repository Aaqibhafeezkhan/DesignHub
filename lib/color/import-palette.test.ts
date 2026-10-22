import { expect, test } from "vitest";

import { fromHex, toHex } from "@/lib/color/color";
import { gimpPalette, namedPalette } from "@/lib/color/export";
import { parsePaletteImport } from "@/lib/color/import-palette";
import { defaultShadeOptions } from "@/lib/color/shades";

test("parses a Coolors palette URL", () => {
  const result = parsePaletteImport("https://coolors.co/264653-2a9d8f-e9c46a-f4a261-e76f51");

  expect(result.colors.map(toHex)).toEqual(["#264653", "#2a9d8f", "#e9c46a", "#f4a261", "#e76f51"]);
  expect(result.dropped).toBe(0);
});

test("parses the Coolors palette URL format", () => {
  const result = parsePaletteImport("https://coolors.co/palette/264653-2a9d8f-e9c46a");

  expect(result.colors.map(toHex)).toEqual(["#264653", "#2a9d8f", "#e9c46a"]);
  expect(result.dropped).toBe(0);
});

test("parses hex codes from surrounding text", () => {
  const result = parsePaletteImport("Primary: #264653, accent #2a9d8f and highlight #e9c46a.");

  expect(result.colors.map(toHex)).toEqual(["#264653", "#2a9d8f", "#e9c46a"]);
});

test("accepts three digit hex codes", () => {
  const result = parsePaletteImport("#abc, #def");

  expect(result.colors.map(toHex)).toEqual(["#aabbcc", "#ddeeff"]);
});

test("drops colors after the maximum", () => {
  const result = parsePaletteImport(
    "#000000 #111111 #222222 #333333 #444444 #555555 #666666 #777777 #888888 #999999 #aaaaaa",
  );

  expect(result.colors.length).toBe(10);
  expect(result.dropped).toBe(1);
});

test("returns no colors when the input has no hex codes", () => {
  const result = parsePaletteImport("not a palette");

  expect(result.colors).toEqual([]);
  expect(result.dropped).toBe(0);
});

test("round-trips a DesignHub GIMP palette export", () => {
  const colors = [fromHex("#6366f1"), fromHex("#f59e0b"), fromHex("#10b981")];
  const named = namedPalette(colors, defaultShadeOptions);
  const gpl = gimpPalette(named, false, "Acme Labs");
  const result = parsePaletteImport(gpl);

  expect(result.colors.map(toHex)).toEqual(colors.map(toHex));
  expect(result.names).toEqual(named.map((entry) => entry.name));
  expect(result.dropped).toBe(0);
});

test("parses GIMP palette R G B tab name lines and skips header comments", () => {
  const gpl = [
    "GIMP Palette",
    "Name: Inkscape sample",
    "Columns: 3",
    "#",
    "255   0   0\tRed",
    "  0 128   0\tGreen",
    " 10  20  30\tSlate",
  ].join("\n");

  const result = parsePaletteImport(gpl);

  expect(result.colors.map(toHex)).toEqual(["#ff0000", "#008000", "#0a141e"]);
  expect(result.names).toEqual(["Red", "Green", "Slate"]);
  expect(result.dropped).toBe(0);
});

test("ignores malformed GIMP lines and caps at the swatch limit", () => {
  const lines = [
    "GIMP Palette",
    "Name: Too many",
    "#",
    "not a color",
    "999 0 0\tBad",
    "0 0 0\tzero",
    "17 17 17\tone",
    "34 34 34\ttwo",
    "51 51 51\tthree",
    "68 68 68\tfour",
    "85 85 85\tfive",
    "102 102 102\tsix",
    "119 119 119\tseven",
    "136 136 136\teight",
    "153 153 153\tnine",
    "170 170 170\tten",
  ];
  const result = parsePaletteImport(lines.join("\n"));

  expect(result.colors.map(toHex)).toEqual([
    "#000000",
    "#111111",
    "#222222",
    "#333333",
    "#444444",
    "#555555",
    "#666666",
    "#777777",
    "#888888",
    "#999999",
  ]);
  expect(result.names).toEqual(["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"]);
  expect(result.dropped).toBe(1);
});

test("returns no colors for an invalid GIMP palette header with no entries", () => {
  const result = parsePaletteImport("GIMP Palette\nName: Empty\n#\nnot-a-swatch\n999 999 999\tBad\n");

  expect(result.colors).toEqual([]);
  expect(result.names).toEqual([]);
  expect(result.dropped).toBe(0);
});
