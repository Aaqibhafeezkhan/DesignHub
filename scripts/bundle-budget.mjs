/**
 * Absolute first-load budgets for `bundle-size.mjs`. The comparison with the base branch catches a big jump;
 * a budget also catches the slow creep of many small changes, because it does not move when the base does.
 *
 * The file is `bundle-budget.json`: `{ "routes": { "/colors": 345 }, "default": 400 }`, in gzipped kB. A route
 * with no entry uses `default`, and with no default it fails, so a new route is a deliberate decision.
 */

/** Checks each route's gzipped size (in bytes) against the budget. Returns one row per route. */
export function checkBudget(routes, budget) {
  return Object.entries(routes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([route, size]) => {
      const limit = budget.routes?.[route] ?? budget.default;
      const kb = size.gzip / 1024;
      if (limit === undefined) return { route, kb, limit: null, status: "no budget" };
      return { route, kb, limit, status: kb > limit ? "over" : "ok" };
    });
}

/** The routes that broke the budget, as a sentence that names each size and limit. */
export function budgetProblems(rows) {
  return rows
    .filter((row) => row.status !== "ok")
    .map((row) =>
      row.status === "no budget"
        ? `${row.route} has no budget (${row.kb.toFixed(1)} kB): add one to bundle-budget.json`
        : `${row.route} is ${row.kb.toFixed(1)} kB, over its budget of ${row.limit} kB`,
    );
}

/** Reads a budget object from JSON text, rejecting anything that is not a table of positive numbers. */
export function parseBudget(text) {
  const data = JSON.parse(text);
  const valid = (value) => typeof value === "number" && Number.isFinite(value) && value > 0;
  if (typeof data !== "object" || data === null || Array.isArray(data))
    throw new Error("The budget must be an object.");
  const routes = data.routes ?? {};
  if (typeof routes !== "object" || routes === null || Array.isArray(routes) || !Object.values(routes).every(valid)) {
    throw new Error("Every budget in `routes` must be a positive number of kB.");
  }
  if (data.default !== undefined && !valid(data.default)) throw new Error("`default` must be a positive number of kB.");
  return { routes, default: data.default };
}
