import { describe, expect, test } from "vitest";

import { parseCssImport, planCssImport } from "@/lib/brand/import-css";

describe("colors", () => {
  test("reads hex, rgb, hsl and oklch values", () => {
    const { colors } = parseCssImport(
      ":root { --a: #ff0000; --b: rgb(0 128 0); --c: hsl(240 100% 50%); --d: oklch(0.7 0.15 60); --e: rgba(0, 0, 0, 0.5); }",
    );
    expect(colors.map((color) => color.hex)).toEqual(
      expect.arrayContaining(["#ff0000", "#008000", "#0000ff", "#000000"]),
    );
    expect(colors).toHaveLength(5);
  });

  test("short hex and 8 digit hex merge with their opaque form", () => {
    const { colors } = parseCssImport("a { color: #f00; } b { color: #FF0000; } c { color: #ff0000cc; }");
    expect(colors).toEqual([expect.objectContaining({ hex: "#ff0000", count: 3 })]);
  });

  test("ranks by frequency, then by first appearance", () => {
    const { colors } = parseCssImport("a{color:#111111} b{color:#222222} c{color:#222222} d{color:#333333}");
    expect(colors.map((color) => color.hex)).toEqual(["#222222", "#111111", "#333333"]);
    expect(colors[0]?.count).toBe(2);
  });

  test("ignores var(), currentColor, comments, selectors and urls", () => {
    const css = `
      /* color: #abcdef; */
      #fff:hover { border-color: currentColor; }
      .a { color: var(--brand, #123456); background: url(#abc) ; fill: CurrentColor; }
      .b { color: rgb(var(--rgb) / 0.5); }
    `;
    const result = parseCssImport(css);
    expect(result.colors).toEqual([]);
    expect(result.ignored).toBe(4);
  });

  test("skips invalid values and fully transparent colors", () => {
    const { colors } = parseCssImport("a{color:#12; b:#ggg; c:rgb(nope); d:rgba(0,0,0,0); e:#0a0a0a}");
    expect(colors.map((color) => color.hex)).toEqual(["#0a0a0a"]);
  });

  test("empty and non-CSS input finds nothing", () => {
    for (const input of ["", "   ", "hello world", "{}", "{{{"]) {
      expect(parseCssImport(input)).toEqual({ colors: [], fonts: [], ignored: 0 });
    }
  });
});

describe("fonts", () => {
  const known = (family: string) => ["Inter", "Playfair Display"].includes(family);

  test("extracts families from font-family, dropping generics and quotes", () => {
    const { fonts } = parseCssImport(
      `body { font-family: "Inter", -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important; }
       h1 { font-family: 'Playfair Display', serif; }`,
      { isKnownFont: known },
    );
    expect(fonts).toEqual([
      { family: "Inter", count: 1, known: true },
      { family: "Segoe UI", count: 1, known: false },
      { family: "Playfair Display", count: 1, known: true },
    ]);
  });

  test("reads font custom properties but not sizes or var() stacks", () => {
    const { fonts } = parseCssImport(
      ":root { --font-sans: Inter, sans-serif; --font-size: 16px; --font-heading: var(--font-sans); font-size: 12px; }",
    );
    expect(fonts.map((font) => font.family)).toEqual(["Inter"]);
  });

  test("counts @font-face and ranks by frequency", () => {
    const { fonts } = parseCssImport(
      "@font-face { font-family: Foo; src: url(foo.woff2); } a { font-family: Bar } b { font-family: Bar }",
    );
    expect(fonts.map((font) => [font.family, font.count])).toEqual([
      ["Bar", 2],
      ["Foo", 1],
    ]);
  });
});

describe("planCssImport", () => {
  test("uses the top colors and the two most used known fonts, and lists the rest", () => {
    const css =
      Array.from({ length: 12 }, (_, i) => `a{color:#${(i + 1).toString(16).padStart(2, "0").repeat(3)}}`).join("") +
      "a{font-family:Mystery} a{font-family:Mystery} b{font-family:Inter} c{font-family:Lora}";
    const plan = planCssImport(parseCssImport(css, { isKnownFont: (family) => family !== "Mystery" }));
    expect(plan.palette).toHaveLength(10);
    expect(plan.extraColors).toBe(2);
    expect(plan.headingFont).toBe("Inter");
    expect(plan.bodyFont).toBe("Lora");
    expect(plan.skippedFonts).toEqual(["Mystery"]);
  });

  test("a single color is not enough for a palette", () => {
    const plan = planCssImport(parseCssImport("a{color:#336699}"));
    expect(plan.palette).toBeNull();
  });
});
