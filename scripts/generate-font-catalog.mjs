#!/usr/bin/env node
/**
 * Regenerates lib/typography/catalog-index.json and lib/typography/catalog/<category>.json from the public Google Fonts metadata.
 * DesignHub ships the catalog statically so the app needs no API key and no backend.
 *
 *   node scripts/generate-font-catalog.mjs [limit]
 */
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { splitCatalog } from "./font-catalog-parts.mjs";

const LIMIT = Number(process.argv[2] ?? 1000);
const SOURCE = "https://fonts.google.com/metadata/fonts";
const OUT = fileURLToPath(new URL("../lib/typography/", import.meta.url));

const categories = {
  "Sans Serif": "sans-serif",
  Serif: "serif",
  Display: "display",
  Handwriting: "handwriting",
  Monospace: "monospace",
};

const response = await fetch(SOURCE);
if (!response.ok) throw new Error(`Failed to fetch ${SOURCE}: ${response.status}`);
const text = await response.text();
const data = JSON.parse(text.replace(/^\)\]\}'/, ""));

const families = data.familyMetadataList
  .filter((font) => font.subsets.includes("latin") && categories[font.category])
  .filter((font) => !(font.isNoto && font.primaryScript))
  .sort((a, b) => a.popularity - b.popularity)
  .slice(0, LIMIT)
  .map((font, index) => {
    const variants = Object.keys(font.fonts);
    const weights = [...new Set(variants.map((v) => Number.parseInt(v, 10)))].sort((a, b) => a - b);
    const axes = font.axes
      .map((axis) => ({ tag: axis.tag, min: axis.min, max: axis.max, default: axis.defaultValue }))
      .sort((a, b) => (a.tag === "wght" ? -1 : b.tag === "wght" ? 1 : a.tag.localeCompare(b.tag)));
    return {
      family: font.family,
      category: categories[font.category],
      weights,
      italic: variants.some((v) => v.endsWith("i")),
      ...(axes.length ? { axes } : {}),
      rank: index + 1,
    };
  });

const { index, details } = splitCatalog(families);
await mkdir(`${OUT}catalog`, { recursive: true });
await writeFile(`${OUT}catalog-index.json`, `${JSON.stringify(index)}\n`);
for (const [category, fonts] of Object.entries(details)) {
  await writeFile(`${OUT}catalog/${category}.json`, `${JSON.stringify(fonts)}\n`);
}
console.log(`Wrote ${families.length} families to ${OUT}`);
