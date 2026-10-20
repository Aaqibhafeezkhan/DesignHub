import { describe, expect, test } from "vitest";

import { xmlError } from "@/lib/test/xml";

import {
  AVATAR_CLEAR_SPACE,
  avatarMarkSize,
  logoVariants,
  renderVariant,
  SEAL_MAX_NAME,
  sealLettering,
  type VariantContext,
} from "@/lib/logo/variants";

const ctx = (logo: string): VariantContext => ({
  logo,
  name: "Acme",
  fontFamily: "Inter",
  fontWeight: 700,
  fontCss: "",
  measure: (text, size) => text.length * size * 0.6,
  primary: "#4f46e5",
  text: "#111111",
  light: "#ffffff",
  dark: "#000000",
});

test.each([0.25, 1, 2, 4])("the avatar mark and its clear space fit in the circle (aspect %f)", (aspect) => {
  const size = 512;
  const { width, height } = avatarMarkSize(aspect, size);
  expect(width / height).toBeCloseTo(aspect);
  const pad = height * AVATAR_CLEAR_SPACE;
  // The corners of the clear-space box touch the circle, so its diagonal equals the diameter.
  expect(Math.hypot(width + pad * 2, height + pad * 2)).toBeCloseTo(size);
});

test("the avatar is a 512 px circle on the primary color with the mark centred", () => {
  const svg = renderVariant(
    "avatar",
    ctx(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><rect width="200" height="100" fill="red"/></svg>`,
    ),
  );
  expect(svg).toContain('width="512" height="512"');
  expect(svg).toContain('<circle cx="256" cy="256" r="256" fill="#4f46e5"/>');
  const { width, height } = avatarMarkSize(2, 512);
  expect(svg).toContain(`x="${(512 - width) / 2}"`);
  expect(svg).toContain(`y="${(512 - height) / 2}"`);
  expect(svg).not.toContain("red");
});

test("the avatar exports at 400 and 1024 px in the logo pack", () => {
  expect(logoVariants.find((variant) => variant.id === "avatar")?.pngSizes).toEqual([400, 1024]);
});

const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="red"/></svg>`;
const measure = (text: string, size: number) => text.length * size * 0.6;

describe("seal", () => {
  const sealCtx = (name: string): VariantContext => ({ ...ctx(mark), name });

  test("is in the variants grid and exports at 512 and 1024 px", () => {
    expect(logoVariants.find((variant) => variant.id === "seal")?.pngSizes).toEqual([512, 1024]);
  });

  test("is well-formed SVG with a ring path, two rings and the recolored mark", () => {
    const svg = renderVariant("seal", sealCtx("Acme"));
    expect(xmlError(svg)).toBeNull();
    expect(svg).toContain('<path id="seal-ring"');
    expect(svg).toContain('<textPath href="#seal-ring" startOffset="50%">');
    expect((svg.match(/<circle /g) ?? []).length).toBe(2);
    expect(svg).not.toContain("red");
  });

  test("escapes the name in the path text", () => {
    const svg = renderVariant("seal", sealCtx("A & <B>"));
    expect(xmlError(svg)).toBeNull();
    expect(svg).toContain("A &amp; &lt;B&gt;");
    expect(svg).not.toContain("<B>");
  });

  test("a 3 character name repeats around the ring at full size", () => {
    const { text, size, copies } = sealLettering("abc", measure);
    expect(copies).toBeGreaterThan(1);
    expect(text.startsWith("ABC • ABC")).toBe(true);
    expect(size).toBeGreaterThan(40);
  });

  test("a 40 character name shrinks and stays within the ring", () => {
    const name = "The International Society of Brand Seals";
    expect(name).toHaveLength(40);
    const { text, size, copies } = sealLettering(name, measure);
    expect(copies).toBe(1);
    expect(size).toBeLessThan(56);
    expect(measure(text, size)).toBeLessThanOrEqual(2 * Math.PI * 158);
  });

  test("an overlong name is cut with an ellipsis", () => {
    const { text } = sealLettering("x".repeat(120), measure);
    expect(text).toHaveLength(SEAL_MAX_NAME);
    expect(text.endsWith("…")).toBe(true);
  });
});
