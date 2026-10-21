import { describe, expect, test } from "vitest";

import { formatColor, fromHex, toHex } from "@/lib/color/color";
import {
  adobeSwatchExchange,
  colorExports,
  gimpPalette,
  kritaPalette,
  markdownPalette,
  paintNetColorLimit,
  paintNetPalette,
  namedPalette,
  paletteSvg,
  procreateSwatches,
  procreateSwatchLimit,
  sketchPalette,
  type NamedColor,
} from "@/lib/color/export";
import { defaultShadeOptions, SHADE_STEPS } from "@/lib/color/shades";
import type { ColorFormat } from "@/types/color";

const palette: NamedColor[] = [
  { name: "indigo", color: fromHex("#6366f1"), shades: [{ step: 50, color: fromHex("#0a0b0c") }] },
  { name: "amber", color: fromHex("#f59e0b"), shades: [{ step: 50, color: fromHex("#fff7e6") }] },
];

describe("Markdown palette", () => {
  test.each([
    ["hex", "#6366f1"],
    ["rgb", "rgb(99 102 241)"],
    ["hsl", "hsl(239 84% 67%)"],
    ["oklch", "oklch(58.54% 0.2041 277.12)"],
  ] as const)("keeps HEX and OKLCH details with the selected %s value", (format, value) => {
    expect(markdownPalette([palette[0]], format, false)).toBe(
      `| Name | HEX | OKLCH | Value (${format.toUpperCase()}) |\n` +
        "| --- | --- | --- | --- |\n" +
        `| indigo | #6366f1 | oklch(58.54% 0.2041 277.12) | ${value} |\n`,
    );
  });

  test("includes each color's shades only when enabled, in palette order", () => {
    const names = (includeShades: boolean) =>
      markdownPalette(palette, "hex", includeShades)
        .trim()
        .split("\n")
        .slice(2)
        .map((row) => row.split("|")[1].trim());
    expect(names(false)).toEqual(["indigo", "amber"]);
    expect(names(true)).toEqual(["indigo", "indigo-50", "amber", "amber-50"]);
    expect(markdownPalette(palette, "hex", true)).toContain("| indigo-50 | #0a0b0c |");
  });

  test.each([false, true])("writes a valid empty table with shades %s", (includeShades) => {
    expect(markdownPalette([], "rgb", includeShades)).toBe(
      "| Name | HEX | OKLCH | Value (RGB) |\n| --- | --- | --- | --- |\n",
    );
  });

  test("escapes table delimiters, inline markup and line breaks in names", () => {
    const colors = [{ ...palette[0], name: "a|b\\c`*_[x]~<br>&#124;\r\nnext\nline" }];
    const markdown = markdownPalette(colors, "hex", true);
    expect(markdown).toContain("| a&#124;b&#92;c&#96;&#42;&#95;&#91;x&#93;&#126;&#60;br&#62;&#38;#124; next line |");
    expect(markdown.trim().split("\n")).toHaveLength(4);
    for (const row of markdown.trim().split("\n")) expect(row.split("|")).toHaveLength(6);
  });

  test.each<ColorFormat>(["hex", "rgb", "hsl", "oklch"])(
    "preserves alpha and wide-gamut formatting conventions in %s",
    (format) => {
      const colors = [fromHex("#6366f180"), fromHex("#00000000"), { l: 0.7, c: 0.4, h: 145, alpha: 0.25 }];
      const named = colors.map((color, index) => ({ name: `color-${index}`, color, shades: [] }));
      const rows = markdownPalette(named, format, false).trim().split("\n").slice(2);
      expect(rows).toEqual(
        colors.map(
          (color, index) =>
            `| color-${index} | ${toHex(color)} | ${formatColor(color, "oklch")} | ${formatColor(color, format)} |`,
        ),
      );
      expect(rows[0]).toContain("#6366f180");
      expect(rows[1]).toContain("#00000000");
      expect(rows[2]).toContain("oklch(70% 0.4 145 / 0.25)");
    },
  );

  test("registers the format with existing names and all configured 50-950 shades", () => {
    const colors = [fromHex("#6366f1"), fromHex("#6366f1")];
    const shadeOptions = { hueShift: 17, anchor: false };
    const formats = colorExports({
      colors,
      gradient: { type: "linear", angle: 90, x: 50, y: 50, interpolation: "oklch", stops: [] },
      format: "hsl",
      includeShades: true,
      shadeOptions,
    });
    const markdown = formats.find((format) => format.id === "markdown");
    expect(markdown).toMatchObject({ label: "Markdown", filename: "palette.md", language: "text" });
    expect(markdown?.code).toBe(markdownPalette(namedPalette(colors, shadeOptions), "hsl", true));
    const names = markdown?.code
      .trim()
      .split("\n")
      .slice(2)
      .map((row) => row.split("|")[1].trim());
    expect(names).toEqual([
      "indigo",
      ...SHADE_STEPS.map((step) => `indigo-${step}`),
      "indigo-2",
      ...SHADE_STEPS.map((step) => `indigo-2-${step}`),
    ]);
    expect(markdown?.code).not.toBe(markdownPalette(namedPalette(colors, defaultShadeOptions), "hsl", true));
  });
});

describe("GIMP palette", () => {
  test("writes the header and one R G B<TAB>name line per color", () => {
    const gpl = gimpPalette(palette, false, "Acme Labs");
    expect(gpl.startsWith("GIMP Palette\nName: Acme Labs\n#\n")).toBe(true);
    expect(gpl).toContain(" 99 102 241\tindigo\n");
    expect(gpl).toContain("245 158  11\tamber\n");
    expect(gpl).not.toContain("indigo-50");
  });

  test("adds shades as their own named lines, one row per color", () => {
    const gpl = gimpPalette(palette, true, "Acme\nLabs");
    expect(gpl).toContain("Name: Acme Labs\nColumns: 2\n");
    expect(gpl).toContain(" 10  11  12\tindigo-50\n");
  });

  test("is listed in the color exports", () => {
    const formats = colorExports({
      colors: [fromHex("#6366f1")],
      gradient: {
        type: "linear",
        angle: 90,
        x: 50,
        y: 50,
        interpolation: "oklch",
        stops: [
          { id: "a", color: fromHex("#6366f1"), position: 0 },
          { id: "b", color: fromHex("#f59e0b"), position: 100 },
        ],
      },
      format: "hex",
      includeShades: false,
      shadeOptions: defaultShadeOptions,
    });
    const gpl = formats.find((format) => format.id === "gpl");
    expect(gpl?.filename).toBe("palette.gpl");
    expect(gpl?.code).toMatch(/^GIMP Palette\nName: DesignHub palette\n#\n 99 102 241\t\S+\n$/);
  });
});

describe("Adobe Swatch Exchange", () => {
  const utf16 = (text: string) => [...text].flatMap((char) => [0, char.charCodeAt(0)]);
  const float = (value: number) => {
    const view = new DataView(new ArrayBuffer(4));
    view.setFloat32(0, value);
    return [...new Uint8Array(view.buffer)];
  };

  test("writes the ASEF header, version 1.0 and the block count", () => {
    const ase = adobeSwatchExchange(palette, false);
    expect([...ase.slice(0, 12)]).toEqual([0x41, 0x53, 0x45, 0x46, 0, 1, 0, 0, 0, 0, 0, 2]);
  });

  test("encodes a color as a named RGB float block", () => {
    const ase = adobeSwatchExchange(palette, false);
    const indigo = [
      ...[0x00, 0x01], // color entry
      ...[0, 0, 0, 34], // block length
      ...[0, 7], // "indigo" plus the terminator, in UTF-16 code units
      ...utf16("indigo"),
      ...[0, 0],
      ...[0x52, 0x47, 0x42, 0x20], // "RGB "
      ...float(99 / 255),
      ...float(102 / 255),
      ...float(241 / 255),
      ...[0, 2], // normal (process) color
    ];
    expect([...ase.slice(12, 12 + indigo.length)]).toEqual(indigo);
    // "amber" is one UTF-16 unit (two bytes) shorter than "indigo".
    expect(ase.length).toBe(12 + indigo.length + indigo.length - 2);
  });

  test("groups each color with its shades", () => {
    const ase = adobeSwatchExchange(palette, true);
    const view = new DataView(ase.buffer);
    // A group start, the base color, one shade and a group end for each color.
    expect(view.getUint32(8)).toBe(8);
    expect([...ase.slice(12, 22)]).toEqual([0xc0, 0x01, 0, 0, 0, 16, 0, 7, ...utf16("i")]);
    const groupEnd = [0xc0, 0x02, 0, 0, 0, 0];
    const ends = ase.reduce((count, _, i) => (groupEnd.every((byte, j) => ase[i + j] === byte) ? count + 1 : count), 0);
    expect(ends).toBe(2);
    expect([...ase.slice(-6)]).toEqual(groupEnd);
  });
});

describe("Palette SVG", () => {
  test("renders colors in order with their names and hex values", () => {
    const svg = paletteSvg(palette);

    expect(svg.indexOf("#6366f1")).toBeLessThan(svg.indexOf("#f59e0b"));

    expect(svg).toContain(">indigo</text>");
    expect(svg).toContain(">amber</text>");

    expect(svg).toContain(">#6366f1</text>");
    expect(svg).toContain(">#f59e0b</text>");
  });

  test("uses readable black or white text based on the background", () => {
    const svg = paletteSvg([
      {
        name: "black",
        color: fromHex("#000000"),
        shades: [],
      },
      {
        name: "white",
        color: fromHex("#ffffff"),
        shades: [],
      },
    ]);

    expect(svg).toContain('fill="#ffffff" text-anchor="middle"');
    expect(svg).toContain('fill="#000000" text-anchor="middle"');
  });
});

describe("Sketch palette", () => {
  test("writes format 2.0 with named RGBA floats from 0 to 1", () => {
    const sketch = JSON.parse(sketchPalette(palette, false)) as {
      compatibleVersion: string;
      pluginVersion: string;
      colors: { name: string; red: number; green: number; blue: number; alpha: number }[];
    };
    expect(sketch.compatibleVersion).toBe("2.0");
    expect(sketch.pluginVersion).toBe("2.22");
    expect(sketch.colors).toHaveLength(2);
    expect(sketch.colors[0]).toEqual({ name: "indigo", red: 0.388235, green: 0.4, blue: 0.945098, alpha: 1 });
  });

  test("adds shades after each color and is listed in the color exports", () => {
    const sketch = JSON.parse(sketchPalette(palette, true)) as { colors: { name: string }[] };
    expect(sketch.colors.map((color) => color.name)).toEqual(["indigo", "indigo-50", "amber", "amber-50"]);
    const formats = colorExports({
      colors: [fromHex("#6366f1")],
      gradient: {
        type: "linear",
        angle: 90,
        x: 50,
        y: 50,
        interpolation: "oklch",
        stops: [
          { id: "a", color: fromHex("#6366f1"), position: 0 },
          { id: "b", color: fromHex("#f59e0b"), position: 100 },
        ],
      },
      format: "hex",
      includeShades: false,
      shadeOptions: defaultShadeOptions,
    });
    expect(formats.find((format) => format.id === "sketch")?.filename).toBe("palette.sketchpalette");
  });
});

/** Reads the first entry of a stored (uncompressed) ZIP, the only kind createZip writes. */
function firstZipEntry(zip: Uint8Array): { name: string; text: string } {
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  expect(view.getUint32(0, true)).toBe(0x04034b50);
  const size = view.getUint32(18, true);
  const nameLength = view.getUint16(26, true);
  const decoder = new TextDecoder();
  return {
    name: decoder.decode(zip.subarray(30, 30 + nameLength)),
    text: decoder.decode(zip.subarray(30 + nameLength, 30 + nameLength + size)),
  };
}

type ProcreateJson = { name: string; swatches: { hue: number; saturation: number; brightness: number }[] }[];

describe("Procreate swatches", () => {
  const named = (count: number, shades: number): NamedColor[] =>
    Array.from({ length: count }, (_, i) => ({
      name: `c${i}`,
      color: fromHex("#ff0000"),
      shades: Array.from({ length: shades }, (_, s) => ({ step: (s + 1) * 100, color: fromHex("#00ff00") })),
    }));

  test("zips Swatches.json with a named palette of HSB colors", () => {
    const result = procreateSwatches(palette, true, "Acme Labs");
    const entry = firstZipEntry(result.bytes);
    expect(entry.name).toBe("Swatches.json");
    const json = JSON.parse(entry.text) as ProcreateJson;
    expect(json[0]?.name).toBe("Acme Labs");
    expect(json[0]?.swatches).toHaveLength(4);
    // #f59e0b is hue 37.7 degrees, saturation 95.5% and brightness 96.1%.
    expect(json[0]?.swatches[2]).toEqual({
      hue: 0.104701,
      saturation: 0.955102,
      brightness: 0.960784,
      alpha: 1,
      colorSpace: 0,
    });
    expect(result.shadesDropped).toBe(false);
  });

  test("falls back to base colors when shades don't fit in 30 swatches", () => {
    const result = procreateSwatches(named(3, 11), true);
    const json = JSON.parse(firstZipEntry(result.bytes).text) as ProcreateJson;
    expect(json[0]?.swatches).toHaveLength(3);
    expect(json[0]?.swatches[0]).toMatchObject({ hue: 0, saturation: 1, brightness: 1 });
    expect(result.shadesDropped).toBe(true);
    expect(procreateSwatches(named(2, 11), true).shadesDropped).toBe(false);
  });

  test("keeps the first 30 base colors and reports the rest", () => {
    const result = procreateSwatches(named(32, 0), false);
    const json = JSON.parse(firstZipEntry(result.bytes).text) as ProcreateJson;
    expect(json[0]?.swatches).toHaveLength(procreateSwatchLimit);
    expect(json[0]?.name).toBe("DesignHub palette");
    expect(result).toMatchObject({ shadesDropped: false, colorsDropped: 2 });
  });
});

/** Every entry of a stored ZIP, in order. */
function zipEntries(zip: Uint8Array): { name: string; text: string }[] {
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  const decoder = new TextDecoder();
  const entries: { name: string; text: string }[] = [];
  let offset = 0;
  while (view.getUint32(offset, true) === 0x04034b50) {
    expect(view.getUint16(offset + 8, true)).toBe(0);
    const size = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const start = offset + 30 + nameLength;
    entries.push({
      name: decoder.decode(zip.subarray(offset + 30, start)),
      text: decoder.decode(zip.subarray(start, start + size)),
    });
    offset = start + size;
  }
  return entries;
}

describe("Krita palette", () => {
  test("starts with an uncompressed mimetype, then colorset.xml", () => {
    const entries = zipEntries(kritaPalette(palette, false));
    expect(entries.map((entry) => entry.name)).toEqual(["mimetype", "colorset.xml"]);
    expect(entries[0]?.text).toBe("krita/x-colorset");
  });

  test("lists the base colors in one row without shades", () => {
    const xml = zipEntries(kritaPalette(palette, false, "Acme & Co"))[1]?.text ?? "";
    expect(xml).toContain('<ColorSet version="2.0" name="Acme &amp; Co"');
    expect(xml).toContain('columns="2" rows="1"');
    expect(xml).not.toContain("<Group");
    expect(xml).toContain(
      [
        '  <ColorSetEntry name="amber" id="#f59e0b" spot="false" bitdepth="U8">',
        '    <RGB space="sRGB-elle-V2-srgbtrc.icc" r="0.960784" g="0.619608" b="0.043137"/>',
        '    <Position row="0" column="1"/>',
        "  </ColorSetEntry>",
      ].join("\n"),
    );
    expect(xml.match(/<ColorSetEntry /g)).toHaveLength(2);
  });

  test("groups each color with its shades", () => {
    const xml = zipEntries(kritaPalette(palette, true))[1]?.text ?? "";
    expect(xml).toContain('name="DesignHub palette"');
    expect(xml).toContain('columns="2" rows="0"');
    expect(xml.match(/<Group name="(\w+)" rows="1">/g)).toEqual([
      '<Group name="indigo" rows="1">',
      '<Group name="amber" rows="1">',
    ]);
    const amber = xml.slice(xml.indexOf('<Group name="amber"'));
    expect(amber).toContain('<ColorSetEntry name="amber-50" id="#fff7e6"');
    expect(amber).toContain('<Position row="0" column="1"/>');
    expect(xml.match(/<ColorSetEntry /g)).toHaveLength(4);
  });
});

describe("Paint.NET palette", () => {
  test("writes comment lines, then one uppercase AARRGGBB color per line", () => {
    const { text, shadesDropped, colorsDropped } = paintNetPalette(palette, false, "Acme Labs");
    expect(text).toBe("; paint.net Palette File\n; Name: Acme Labs\n; Colors: 2\nFF6366F1\nFFF59E0B\n");
    expect(shadesDropped).toBe(false);
    expect(colorsDropped).toBe(0);
  });

  test("includes shades after each color when they fit", () => {
    const lines = paintNetPalette(palette, true)
      .text.split("\n")
      .filter((line) => !line.startsWith(";") && line);
    expect(lines).toEqual(["FF6366F1", "FF0A0B0C", "FFF59E0B", "FFFFF7E6"]);
  });

  test("keeps alpha first and collapses line breaks in the name", () => {
    const translucent: NamedColor[] = [{ name: "glass", color: { ...fromHex("#102030"), alpha: 0.5 }, shades: [] }];
    expect(paintNetPalette(translucent, false, "A\nB").text).toContain("; Name: A B\n");
    expect(paintNetPalette(translucent, false).text).toContain("\n80102030\n");
  });

  test("caps the palette at 96 colors, dropping shades first and then colors", () => {
    const shaded = (count: number): NamedColor[] =>
      Array.from({ length: count }, (_, i) => ({
        name: `c${i}`,
        color: fromHex("#336699"),
        shades: Array.from({ length: 11 }, (_, step) => ({ step: 50 + step, color: fromHex("#99aabb") })),
      }));
    const dropShades = paintNetPalette(shaded(10), true);
    expect(dropShades.shadesDropped).toBe(true);
    expect(dropShades.text.match(/^[0-9A-F]{8}$/gm)).toHaveLength(10);
    const tooMany = paintNetPalette(shaded(100), false);
    expect(tooMany.text.match(/^[0-9A-F]{8}$/gm)).toHaveLength(paintNetColorLimit);
    expect(tooMany.colorsDropped).toBe(4);
  });
});
