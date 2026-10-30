export type RetriedTest = { title: string; file: string; attempts: number };
export function retriedTests(report: unknown): RetriedTest[];
export function summary(found: RetriedTest[]): string;
