#!/usr/bin/env node
/**
 * Lists the end-to-end tests that failed and then passed on a retry, from Playwright's JSON report, as a
 * Markdown table for the job summary and one warning annotation each:
 *   node scripts/flaky-tests.mjs test-results/report.json >> "$GITHUB_STEP_SUMMARY"
 * A test that needed a retry passes the job but is not fine: it is a test to fix.
 */
import { readFile } from "node:fs/promises";

/** Tests with more than one attempt whose last attempt passed, from a parsed Playwright JSON report. */
export function retriedTests(report) {
  const found = [];
  const visit = (suite, titles) => {
    const here = suite.title ? [...titles, suite.title] : titles;
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const results = test.results ?? [];
        const last = results.at(-1);
        if (results.length > 1 && last?.status === "passed") {
          found.push({
            title: [...here, spec.title].join(" › "),
            file: spec.file ?? suite.file ?? "",
            attempts: results.length,
          });
        }
      }
    }
    for (const child of suite.suites ?? []) visit(child, here);
  };
  for (const suite of report.suites ?? []) visit(suite, []);
  return found;
}

export function summary(found) {
  if (found.length === 0) return "### End-to-end tests\n\nNo test needed a retry.\n";
  const rows = found.map((item) => `| \`${item.file}\` | ${item.title.replaceAll("|", "\\|")} | ${item.attempts} |`);
  return [
    "### End-to-end tests that needed a retry",
    "",
    "These passed, but only after failing at least once. Each is a flaky test to fix.",
    "",
    "| File | Test | Attempts |",
    "| --- | --- | ---: |",
    ...rows,
    "",
  ].join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = JSON.parse(await readFile(process.argv[2] ?? "test-results/report.json", "utf8"));
  const found = retriedTests(report);
  for (const item of found) console.error(`::warning file=${item.file}::Needed a retry: ${item.title}`);
  console.log(summary(found));
}
