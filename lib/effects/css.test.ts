import { describe, expect, test } from "vitest";

import { camelCase, cssRule, effectStylesheet, hexToRgba, tailwindClasses, tailwindValue } from "@/lib/effects/css";

describe("cssRule", () => {
  test("writes one indented line per declaration", () => {
    expect(
      cssRule(".card", [
        { property: "color", value: "red" },
        { property: "box-shadow", value: "0 1px 2px #000, 0 0 0 1px #fff" },
      ]),
    ).toBe(".card {\n  color: red;\n  box-shadow: 0 1px 2px #000, 0 0 0 1px #fff;\n}\n");
  });

  test("still writes a rule with no declarations", () => {
    expect(cssRule(".empty", [])).toBe(".empty {\n\n}\n");
  });
});

describe("effectStylesheet", () => {
  const declarations = [{ property: "color", value: "red" }];

  test("is just the main rule when there are no extras", () => {
    expect(effectStylesheet({ declarations }, ".x")).toBe(".x {\n  color: red;\n}\n");
  });

  test("adds pseudo-element rules for the selector, then global at-rules", () => {
    const css = effectStylesheet(
      {
        declarations,
        extra: (selector) => `${selector}::before {\n  content: "";\n}\n`,
        global: "@keyframes spin {}\n",
      },
      ".x",
    );
    expect(css).toBe('.x {\n  color: red;\n}\n\n.x::before {\n  content: "";\n}\n\n@keyframes spin {}\n');
  });
});

describe("tailwindValue", () => {
  test("turns spaces into underscores and escapes literal underscores", () => {
    expect(tailwindValue("blur(12px) saturate(1.5)")).toBe("blur(12px)_saturate(1.5)");
    expect(tailwindValue("var(--my_var)")).toBe("var(--my\\_var)");
  });

  test("drops the spaces around commas", () => {
    expect(tailwindValue("0 1px 2px #000 , 0 0 4px #fff")).toBe("0_1px_2px_#000,0_0_4px_#fff");
  });
});

describe("tailwindClasses", () => {
  test("leaves out a -webkit- twin of an unprefixed declaration", () => {
    expect(
      tailwindClasses([
        { property: "backdrop-filter", value: "blur(12px)" },
        { property: "-webkit-backdrop-filter", value: "blur(12px)" },
      ]),
    ).toBe("[backdrop-filter:blur(12px)]");
  });

  test("keeps a prefixed-only property", () => {
    expect(tailwindClasses([{ property: "-webkit-text-fill-color", value: "transparent" }])).toBe(
      "[-webkit-text-fill-color:transparent]",
    );
  });

  test("is empty for no declarations", () => {
    expect(tailwindClasses([])).toBe("");
  });
});

describe("camelCase", () => {
  test.each([
    ["color", "color"],
    ["backdrop-filter", "backdropFilter"],
    ["-webkit-backdrop-filter", "WebkitBackdropFilter"],
    ["-webkit-text-fill-color", "WebkitTextFillColor"],
  ])("%s becomes %s", (input, expected) => {
    expect(camelCase(input)).toBe(expected);
  });
});

describe("hexToRgba", () => {
  test("reads six-digit and three-digit colours, with or without #", () => {
    expect(hexToRgba("#ff8000", 0.5)).toBe("rgb(255 128 0 / 0.5)");
    expect(hexToRgba("f80", 1)).toBe("rgb(255 136 0 / 1)");
  });

  test("ignores an alpha channel in the hex and rounds alpha to three places", () => {
    expect(hexToRgba("#00000080", 0.12345)).toBe("rgb(0 0 0 / 0.123)");
  });
});
