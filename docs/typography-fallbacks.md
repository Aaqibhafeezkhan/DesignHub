# Size-adjusted font fallbacks

When a webfont is still loading, the browser draws text in a local fallback. If that face is wider or taller than the webfont, the layout jumps when the swap happens. DesignHub's Typography export can emit an `@font-face` that reshapes a system font so it occupies roughly the same space as the webfont.

## What the export contains

In the Typography Studio **Export** tab, open **Fallback CSS**. For each font in the current pairing that has metrics in the bundled catalog you get:

```css
/* Poppins: metrics matched to local Arial */
@font-face {
  font-family: "Poppins Fallback";
  src: local("Arial");
  size-adjust: 54.7645%;
  ascent-override: 191.73%;
  descent-override: 63.91%;
  line-gap-override: 18.26%;
}
```

The system font named in the comment is the one the percentages were computed against:

| Catalog category                 | Local font      |
| -------------------------------- | --------------- |
| sans-serif, display, handwriting | Arial           |
| serif                            | Times New Roman |
| monospace                        | Courier New     |

`size-adjust` scales the local glyphs to the webfont's average character width. The three `*-override` descriptors then match the webfont's ascent, descent and line gap (Chrome / Fontaine formula).

## How to use it in a font stack

1. Paste the Fallback CSS next to your webfont `@import` or `@font-face` rules.
2. Put the `* Fallback` family immediately after the webfont name:

```css
font-family: "Poppins", "Poppins Fallback", ui-sans-serif, system-ui, sans-serif;
```

The CSS, Tailwind, SCSS and React typography exports already insert that middle family when metrics exist for the heading and body fonts. Keep the Fallback CSS file (or its `@font-face` rules) in the page so the local face is registered.

## Where the numbers come from

- Catalog fonts: latin average width and vertical metrics bundled in `lib/typography/metrics.json`.
- A local file dropped on the Font inspector: OpenType.js reads `hhea` / `OS/2` (`xAvgCharWidth`) through `metricsFromTables` in `lib/typography/inspect-font.ts`.
- Pure helpers live in `lib/typography/fallback.ts` (`computeFallbackOverrides`, `formatFallbackFontFace`).
