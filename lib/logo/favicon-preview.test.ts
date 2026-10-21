import { describe, expect, test, vi } from "vitest";

import { FAVICON_PREVIEW_SIZES, TAB_THEMES, faviconSvg } from "@/lib/logo/favicon-preview";
import { faviconFiles } from "@/lib/logo/pack";
import { renderVariant, type VariantContext } from "@/lib/logo/variants";
import { xmlError } from "@/lib/test/xml";

// Rasterizing needs a canvas, which the test environment doesn't have. Only the SVG is checked here.
vi.mock("@/lib/icons/raster", () => ({ svgToPngBytes: async () => new Uint8Array([137, 80, 78, 71]) }));

const ctx = (name = "Acme"): VariantContext => ({
  logo: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#4f46e5"/></svg>',
  name,
  fontFamily: "Inter",
  fontWeight: 700,
  fontCss: "",
  measure: (text, size) => text.length * size * 0.6,
  primary: "#4f46e5",
  text: "#111111",
  light: "#ffffff",
  dark: "#000000",
});

describe("favicon preview", () => {
  test("draws the app icon variant, as a well-formed SVG", () => {
    const svg = faviconSvg(ctx());
    expect(svg).toBe(renderVariant("app-icon", ctx()));
    expect(xmlError(svg)).toBeNull();
  });

  test("the preview icon is the same SVG the favicon package exports", async () => {
    const files = await faviconFiles(ctx());
    expect(files.find((file) => file.name === "icon.svg")?.data).toBe(faviconSvg(ctx()));
  });

  test("the icon follows the brand", () => {
    expect(faviconSvg(ctx())).not.toBe(
      faviconSvg({ ...ctx(), primary: "#dc2626", logo: ctx().logo.replace("#4f46e5", "#dc2626") }),
    );
  });

  test("shows 16 and 32 px in a light and a dark tab that can be told apart by their labels", () => {
    expect(FAVICON_PREVIEW_SIZES).toEqual([16, 32]);
    expect(TAB_THEMES.map((theme) => theme.label)).toEqual(["Light tab", "Dark tab"]);
    const [light, dark] = TAB_THEMES;
    expect(light!.tab).not.toBe(dark!.tab);
  });
});
