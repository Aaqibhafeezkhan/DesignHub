import { describe, expect, test } from "vitest";

import { retriedTests, summary } from "../../scripts/flaky-tests.mjs";

const report = {
  suites: [
    {
      title: "a.spec.ts",
      file: "a.spec.ts",
      specs: [
        { title: "steady", file: "a.spec.ts", tests: [{ results: [{ status: "passed" }] }] },
        { title: "flaky", file: "a.spec.ts", tests: [{ results: [{ status: "failed" }, { status: "passed" }] }] },
        { title: "broken", file: "a.spec.ts", tests: [{ results: [{ status: "failed" }, { status: "failed" }] }] },
      ],
      suites: [
        {
          title: "group",
          specs: [
            {
              title: "nested",
              file: "a.spec.ts",
              tests: [{ results: [{ status: "timedOut" }, { status: "passed" }] }],
            },
          ],
        },
      ],
    },
  ],
};

describe("flaky test report", () => {
  test("finds only tests that failed and then passed, including nested ones", () => {
    expect(retriedTests(report).map((item) => item.title)).toEqual(["a.spec.ts › flaky", "a.spec.ts › group › nested"]);
  });

  test("the summary lists them, or says none needed a retry", () => {
    expect(summary(retriedTests(report))).toContain("| `a.spec.ts` | a.spec.ts › flaky | 2 |");
    expect(summary([])).toContain("No test needed a retry.");
  });
});
