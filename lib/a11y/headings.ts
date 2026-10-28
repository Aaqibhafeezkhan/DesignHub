/** The brand book site's heading structure: one h1 per page, no skipped level, no empty heading. */

type HeadingsCheck = {
  /** The page's title, as the brand book's contents list shows it. */
  page: string;
  /** What is wrong with the page's heading structure. */
  problem: string;
};

export type HeadingsSection = {
  criterion: string;
  note: string;
  /** True when every exported page has exactly one h1, no skipped level and no empty heading. */
  pass: boolean;
  /** One row per problem found, in page order. */
  checks: HeadingsCheck[];
  /** How many brand book pages were checked. */
  pages: number;
};

/** An h1 to h6 element in generated HTML, read from the string so no DOM is needed. */
const HEADING = /<h([1-6])(?:\s[^>]*)?>([\s\S]*?)<\/h\1>/gi;

/**
 * The heading problems of one page's HTML, in reading order:
 * a page needs exactly one h1, must not skip a heading level, and must have no empty heading.
 * Runs on the generated HTML string, not a DOM, so it works in tests.
 */
export function headingProblems(html: string): string[] {
  const problems: string[] = [];
  const headings: { level: number; text: string }[] = [];
  for (const match of html.matchAll(HEADING)) {
    headings.push({ level: Number(match[1]), text: (match[2] ?? "").trim() });
  }

  const h1Count = headings.filter((heading) => heading.level === 1).length;
  if (h1Count === 0) {
    problems.push("The page has no h1 element.");
  } else if (h1Count > 1) {
    problems.push(`The page has ${h1Count} h1 elements; it needs exactly one.`);
  }

  let previous = 0;
  for (const heading of headings) {
    if (!heading.text) {
      problems.push(`The h${heading.level} is empty.`);
    }
    if (previous > 0 && heading.level > previous + 1) {
      problems.push(`The page jumps from h${previous} to h${heading.level}, skipping a level.`);
    }
    previous = heading.level;
  }
  return problems;
}

/** The report section: one row per heading problem of the exported brand book pages. */
export function headingSection(pages: { title: string; html: string }[]): HeadingsSection {
  const checks: HeadingsCheck[] = [];
  for (const page of pages) {
    for (const problem of headingProblems(page.html)) {
      checks.push({ page: page.title, problem });
    }
  }
  return {
    criterion: "Brand book heading structure",
    note: "Every exported brand book page has exactly one h1, no skipped heading level and no empty heading, checked on the generated HTML.",
    pass: checks.length === 0,
    checks,
    pages: pages.length,
  };
}
