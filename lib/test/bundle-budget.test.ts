import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import { budgetProblems, checkBudget, parseBudget } from "../../scripts/bundle-budget.mjs";

const kb = (value: number) => ({ gzip: value * 1024 });

describe("bundle budgets", () => {
  test("a route under its budget is ok, and one over it is named with its size and limit", () => {
    const rows = checkBudget({ "/a": kb(100), "/b": kb(120.5) }, { routes: { "/a": 110, "/b": 120 } });
    expect(rows.map((row) => row.status)).toEqual(["ok", "over"]);
    expect(budgetProblems(rows)).toEqual(["/b is 120.5 kB, over its budget of 120 kB"]);
  });

  test("a size exactly at the budget passes", () => {
    expect(checkBudget({ "/a": kb(100) }, { routes: { "/a": 100 } })[0]!.status).toBe("ok");
  });

  test("a route with no budget uses the default, and fails without one", () => {
    const withDefault = checkBudget({ "/new": kb(80) }, { routes: {}, default: 90 });
    expect(withDefault[0]).toMatchObject({ status: "ok", limit: 90 });
    const without = checkBudget({ "/new": kb(80) }, { routes: {} });
    expect(without[0]!.status).toBe("no budget");
    expect(budgetProblems(without)[0]).toContain("/new has no budget");
  });

  test("rows come back in route order", () => {
    const rows = checkBudget({ "/z": kb(1), "/a": kb(1) }, { routes: { "/a": 5, "/z": 5 } });
    expect(rows.map((row) => row.route)).toEqual(["/a", "/z"]);
  });

  test("parseBudget accepts a table of positive numbers and rejects the rest", () => {
    expect(parseBudget('{"routes":{"/":300},"default":400}')).toEqual({ routes: { "/": 300 }, default: 400 });
    for (const bad of [
      "[]",
      '{"routes":{"/":0}}',
      '{"routes":{"/":"300"}}',
      '{"default":-1}',
      '{"routes":[]}',
      "null",
    ]) {
      expect(() => parseBudget(bad), bad).toThrow();
    }
  });

  test("the committed budget file is valid and gives every route a limit", () => {
    const budget = parseBudget(readFileSync(join(__dirname, "..", "..", "bundle-budget.json"), "utf8"));
    expect(Object.keys(budget.routes)).toEqual(expect.arrayContaining(["/", "/colors", "/export", "/social"]));
  });
});
