import { describe, expect, test } from "vitest";

import { faviconHtml, faviconStyle, webManifest } from "@/lib/icons/favicon";
import type { IconStyle } from "@/types/icons";

const options = { appName: "Acme", themeColor: "#112233", backgroundColor: "#ffffff" };

const baseStyle: IconStyle = {
  size: 64,
  color: "#ff0000",
  strokeWidth: null,
  corners: "default",
  rotate: 0,
  flipH: false,
  flipV: false,
  padding: 10,
  background: { shape: "none", color: "#000000" },
};

describe("faviconHtml", () => {
  const lines = faviconHtml(options).split("\n");

  test("lists every icon file with the right rel, sizes and type", () => {
    expect(lines).toContain('<link rel="icon" href="/favicon.ico" sizes="32x32">');
    expect(lines).toContain('<link rel="icon" href="/icon.svg" type="image/svg+xml">');
    expect(lines).toContain('<link rel="apple-touch-icon" href="/apple-touch-icon.png">');
    expect(lines).toContain('<link rel="manifest" href="/site.webmanifest">');
  });

  test("sets the theme color meta tag", () => {
    expect(lines).toContain('<meta name="theme-color" content="#112233">');
    expect(lines).toHaveLength(5);
  });

  test("escapes the theme color so it cannot break out of the attribute", () => {
    const html = faviconHtml({ ...options, themeColor: '#fff"><script>' });
    expect(html).toContain('content="#fff&quot;&gt;&lt;script&gt;"');
    expect(html).not.toContain("<script>");
  });
});

describe("webManifest", () => {
  const manifest = JSON.parse(webManifest(options)) as Record<string, unknown>;

  test("is valid JSON ending in a newline", () => {
    expect(webManifest(options).endsWith("\n")).toBe(true);
  });

  test("carries the brand name and colors", () => {
    expect(manifest.name).toBe("Acme");
    expect(manifest.short_name).toBe("Acme");
    expect(manifest.theme_color).toBe("#112233");
    expect(manifest.background_color).toBe("#ffffff");
    expect(manifest.display).toBe("standalone");
  });

  test("lists the 192 and 512 PNGs plus a maskable one", () => {
    expect(manifest.icons).toEqual([
      { src: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { src: "/icon-512.png", type: "image/png", sizes: "512x512" },
      { src: "/icon-512.png", type: "image/png", sizes: "512x512", purpose: "maskable" },
    ]);
  });

  test("keeps the JSON valid for names with quotes", () => {
    const parsed = JSON.parse(webManifest({ ...options, appName: 'The "Best" App' })) as { name: string };
    expect(parsed.name).toBe('The "Best" App');
  });
});

describe("faviconStyle", () => {
  test("replaces currentColor with the fallback", () => {
    expect(faviconStyle({ ...baseStyle, color: "currentColor" }, "#123456").color).toBe("#123456");
  });

  test("keeps an explicit color", () => {
    expect(faviconStyle(baseStyle, "#123456").color).toBe("#ff0000");
  });

  test("does not mutate the input and keeps other fields", () => {
    const input = { ...baseStyle, color: "currentColor" };
    const result = faviconStyle(input, "#123456");
    expect(input.color).toBe("currentColor");
    expect(result).toEqual({ ...baseStyle, color: "#123456" });
  });
});
