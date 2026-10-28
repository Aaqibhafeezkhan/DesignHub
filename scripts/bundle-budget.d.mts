export type BudgetRow = { route: string; kb: number; limit: number | null; status: "ok" | "over" | "no budget" };
export type Budget = { routes: Record<string, number>; default?: number };
export function checkBudget(routes: Record<string, { gzip: number }>, budget: Budget): BudgetRow[];
export function budgetProblems(rows: BudgetRow[]): string[];
export function parseBudget(text: string): Budget;
