import { describe, expect, test } from "vitest";

import { extractColors, monochromeSvg, recolorSvg } from "@/lib/logo/recolor";
import { sanitizeSvg } from "@/lib/svg/sanitize";
import { xmlError } from "@/lib/test/xml";

const logo = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">',
  "<defs>",
  '<linearGradient id="g"><stop offset="0" stop-color="#F00"/><stop offset="1" style="stop-color: #00FF00"/></linearGradient>',
  "</defs>",
  '<rect width="100" height="100" fill="url(#g)"/>',
  '<circle cx="50" cy="50" r="20" fill="#ABC" stroke="NONE"/>',
  '<path d="M0 0L10 10" fill="none" stroke="RED"/>',
  '<path d="M5 5L20 20" style="FILL:#123456; stroke: rgb(0, 0, 255);opacity:0.5"/>',
  '<text x="10" y="90" fill="currentColor">Acme &amp; Co</text>',
  "</svg>",
].join("");

describe("extractColors", () => {
  test("finds fill, stroke and style colors in any case and short hex, in document order", () => {
    expect(extractColors(logo)).toEqual(["#ff0000", "#00ff00", "#aabbcc", "#123456", "#0000ff"]);
  });

  test("lists each color once", () => {
    const svg = '<svg><rect fill="#fff"/><rect fill="#FFFFFF"/><rect stroke="white"/></svg>';
    expect(extractColors(svg)).toEqual(["#ffffff"]);
  });

  test("skips none, transparent, currentColor, inherit and url() references", () => {
    const svg =
      '<svg><rect fill="none"/><rect fill="transparent"/><rect fill="currentColor"/><rect fill="inherit"/><rect fill="url(#a)"/></svg>';
    expect(extractColors(svg)).toEqual([]);
  });

  test("reads colors marked !important in a style attribute", () => {
    expect(extractColors('<svg><path style="fill: #F00 !important;stroke:blue"/></svg>')).toEqual([
      "#ff0000",
      "#0000ff",
    ]);
  });

  test("returns nothing for invalid markup", () => {
    expect(extractColors("<svg><rect></svg>")).toEqual([]);
    expect(extractColors("not svg")).toEqual([]);
  });
});

describe("recolorSvg", () => {
  test("replaces mapped colors wherever they appear and keeps the markup well formed", () => {
    const out = recolorSvg(logo, { "#ff0000": "#111111", "#123456": "#222222", "#0000ff": "#333333" });
    expect(xmlError(out)).toBeNull();
    expect(extractColors(out)).toEqual(["#111111", "#00ff00", "#aabbcc", "#222222", "#333333"]);
    // Unmapped colors, none, gradient references and other style declarations are untouched.
    expect(out).toContain('fill="#ABC"');
    expect(out).toContain('fill="none"');
    expect(out).toContain('stroke="NONE"');
    expect(out).toContain('fill="url(#g)"');
    expect(out).toContain("opacity:0.5");
    expect(out).toContain("Acme &amp; Co");
  });

  test("keeps the gradient's structure intact", () => {
    const out = recolorSvg(logo, { "#00ff00": "#444444" });
    expect(out).toMatch(/<linearGradient id="g"><stop offset="0" [^>]*\/><stop offset="1" [^>]*\/><\/linearGradient>/);
    expect(out).toContain("stop-color:#444444");
  });

  test("recolors !important declarations and keeps the flag", () => {
    const svg = '<svg><path style="fill: #F00 !important;stroke:blue"/></svg>';
    expect(recolorSvg(svg, { "#ff0000": "#000000" })).toBe(
      '<svg><path style="fill:#000000 !important;stroke:blue"/></svg>',
    );
    expect(monochromeSvg(svg, "#222222")).toContain('style="fill:#222222 !important;stroke:#222222"');
  });

  test("returns the input unchanged when it can't be parsed", () => {
    expect(recolorSvg("<svg>", { "#000000": "#ffffff" })).toBe("<svg>");
  });
});

describe("monochromeSvg", () => {
  test("paints every visible color one color and keeps none and gradient references", () => {
    const out = monochromeSvg(logo, "#000000");
    expect(xmlError(out)).toBeNull();
    expect(extractColors(out)).toEqual(["#000000"]);
    expect(out).toContain('fill="none"');
    expect(out).toContain('stroke="NONE"');
    expect(out).toContain('fill="url(#g)"');
    expect(out).toMatch(/<linearGradient id="g"><stop [^>]*\/><stop [^>]*\/><\/linearGradient>/);
    // currentColor inherits the text color, so it is painted too.
    expect(out).not.toContain("currentColor");
  });

  test("makes the default black fill explicit on the root", () => {
    const out = monochromeSvg('<svg viewBox="0 0 10 10"><path d="M0 0h10v10z"/></svg>', "#ff6600");
    expect(out).toContain('fill="#ff6600"');
    expect(xmlError(out)).toBeNull();
  });

  test("keeps an existing root fill", () => {
    const out = monochromeSvg('<svg fill="none"><path d="M0 0" stroke="#000"/></svg>', "#ff6600");
    expect(out).toMatch(/^<svg fill="none"/);
    expect(out).toContain('stroke="#ff6600"');
  });
});

describe("<style> elements", () => {
  // As Illustrator exports it: classes in a stylesheet, one with !important, plus rules that must stay.
  const illustrator = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">',
    "<defs><style>",
    ".cls-1{fill:#e94e1b;}",
    ".cls-2 { fill: #1D1D1B; stroke: RED !important; stroke-width: 2px }",
    ".cls-3{fill:none;stroke:#e94e1b;opacity:.5}",
    ".cls-4{stop-color:rgb(0, 0, 255)}",
    ".cls-5{fill:url(#g);fill-opacity:.8}",
    "</style></defs>",
    '<path class="cls-1" d="M0 0h50v50z"/>',
    '<path class="cls-2" d="M50 50h50v50z"/>',
    '<path class="cls-3" d="M0 50h50v50z"/>',
    "</svg>",
  ].join("");

  test("lists colors set through classes", () => {
    expect(extractColors(illustrator)).toEqual(["#e94e1b", "#1d1d1b", "#ff0000", "#0000ff"]);
  });

  test("recolors class colors and keeps the rest of the stylesheet", () => {
    const out = recolorSvg(illustrator, { "#e94e1b": "#00aa55", "#ff0000": "#123456" });
    expect(xmlError(out)).toBeNull();
    expect(out).toContain(".cls-1{fill:#00aa55;}");
    expect(out).toContain(".cls-2 { fill: #1D1D1B; stroke: #123456 !important; stroke-width: 2px }");
    expect(out).toContain(".cls-3{fill:none;stroke:#00aa55;opacity:.5}");
    expect(out).toContain(".cls-5{fill:url(#g);fill-opacity:.8}");
    expect(extractColors(out)).toEqual(["#00aa55", "#1d1d1b", "#123456", "#0000ff"]);
  });

  test("turns class colors monochrome", () => {
    const out = monochromeSvg(illustrator, "#ffffff");
    expect(xmlError(out)).toBeNull();
    expect(extractColors(out)).toEqual(["#ffffff"]);
    expect(out).toContain("stroke: #ffffff !important;");
    expect(out).toContain(".cls-3{fill:none;");
    expect(out).toContain("fill:url(#g)");
  });

  test("reads every <style> element, including CDATA content", () => {
    const svg = "<svg><style><![CDATA[.a{fill:#f00}]]></style><style>.b{stroke:#00f}</style></svg>";
    expect(extractColors(svg)).toEqual(["#ff0000", "#0000ff"]);
  });

  test("leaves selectors and other properties that contain paint names alone", () => {
    const svg = "<svg><style>.fill-color{flood-opacity:.5;fill-rule:evenodd}.color{color:#00ff00}</style></svg>";
    expect(recolorSvg(svg, { "#00ff00": "#000000" })).toBe(
      "<svg><style>.fill-color{flood-opacity:.5;fill-rule:evenodd}.color{color:#000000}</style></svg>",
    );
  });

  test("never writes markup or extra rules into the stylesheet", () => {
    const svg = "<svg><style>.a{fill:#ff0000}</style></svg>";
    const out = recolorSvg(svg, { "#ff0000": "red}</style><script>alert(1)</script><style>" });
    expect(out).toBe(svg);
    expect(monochromeSvg(svg, "#000;}.b{fill:url(javascript:alert(1))")).toContain(".a{fill:#ff0000}");
  });

  test("keeps sanitized input sanitized", () => {
    const clean = sanitizeSvg(`${illustrator.slice(0, -6)}<script>alert(1)</script></svg>`) ?? "";
    expect(clean).not.toContain("<script");
    const out = recolorSvg(clean, { "#e94e1b": "#00aa55" });
    expect(out).toContain(".cls-1{fill:#00aa55;}");
    expect(sanitizeSvg(out)).toBe(out);
  });
});
