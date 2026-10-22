import { describe, expect, it } from "vitest";

import { headingProblems, headingSection } from "@/lib/a11y/headings";

describe("headingProblems", () => {
  it("reports two h1 elements", () => {
    const problems = headingProblems("<h1>Brand</h1><p>Intro</p><h1>Brand again</h1>");
    expect(problems).toContain("The page has 2 h1 elements; it needs exactly one.");
  });

  it("reports a page with no h1", () => {
    expect(headingProblems("<h2>Section</h2><p>Text</p>")).toContain("The page has no h1 element.");
  });

  it("reports a skipped level", () => {
    const problems = headingProblems("<h1>Brand</h1><h3>Section</h3><p>Text</p>");
    expect(problems).toContain("The page jumps from h1 to h3, skipping a level.");
  });

  it("reports an empty heading", () => {
    const problems = headingProblems("<h1>Brand</h1><h2>   </h2>");
    expect(problems).toContain("The h2 is empty.");
  });

  it("accepts a well-formed page", () => {
    const problems = headingProblems(
      "<h1>Brand guidelines</h1><h2>Logo</h2><p>Text</p><h2>Color</h2><h3>Accent</h3><p>More</p>",
    );
    expect(problems).toEqual([]);
  });

  it("reads headings with attributes and ignores the pager and navigation", () => {
    const problems = headingProblems('<main><h1 id="top">Brand</h1><h2 class="x">Logo</h2></main>');
    expect(problems).toEqual([]);
  });

  it("does not flag a return to a higher level", () => {
    const problems = headingProblems("<h1>Brand</h1><h2>A</h2><h3>B</h3><h2>C</h2><h3>D</h3>");
    expect(problems).toEqual([]);
  });
});

describe("headingSection", () => {
  it("collects the problems of every page in page order", () => {
    const section = headingSection([
      { title: "Cover", html: "<h1>Cover</h1><p>Text</p>" },
      { title: "Logo usage", html: "<h1>Logo</h1><h1>Logo again</h1>" },
      { title: "Color", html: "<h1>Color</h1><h3>Palette</h3>" },
    ]);

    expect(section.pages).toBe(3);
    expect(section.pass).toBe(false);
    expect(section.checks.map((check) => check.page)).toEqual(["Logo usage", "Color"]);
    expect(section.checks[0]?.problem).toBe("The page has 2 h1 elements; it needs exactly one.");
    expect(section.checks[1]?.problem).toBe("The page jumps from h1 to h3, skipping a level.");
  });

  it("passes when every page is well formed", () => {
    const section = headingSection([
      { title: "Cover", html: "<h1>Cover</h1><p>Text</p>" },
      { title: "Downloads", html: "<h1>Downloads</h1><h2>Logo</h2><h2>Design tokens</h2>" },
    ]);

    expect(section.pages).toBe(2);
    expect(section.pass).toBe(true);
    expect(section.checks).toEqual([]);
  });
});
