#!/usr/bin/env node
/**
 * Writes the Lighthouse scores of the representative (median) run of each page as a Markdown table, for the
 * job summary: `node scripts/lighthouse-summary.mjs >> "$GITHUB_STEP_SUMMARY"`.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

const directory = process.argv[2] ?? ".lighthouseci";
const manifest = JSON.parse(await readFile(path.join(directory, "manifest.json"), "utf8"));
const percent = (score) => (typeof score === "number" ? String(Math.round(score * 100)) : "-");

const lines = [
  "### Lighthouse",
  "",
  "| Page | Performance | Accessibility | Best practices | SEO |",
  "| --- | ---: | ---: | ---: | ---: |",
];
for (const run of manifest.filter((item) => item.isRepresentativeRun)) {
  const { performance, accessibility, "best-practices": bestPractices, seo } = run.summary;
  const page = new URL(run.url).pathname;
  lines.push(
    `| \`${page}\` | ${percent(performance)} | ${percent(accessibility)} | ${percent(bestPractices)} | ${percent(seo)} |`,
  );
}
console.log(lines.join("\n"));
