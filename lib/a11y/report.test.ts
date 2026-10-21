import { describe, expect, test } from "vitest";

import { contrastSection, focusIndicatorCheck, focusSection } from "@/lib/a11y/contrast";
import { gradientSection, gradientTextColors, gradientTextContrast } from "@/lib/a11y/gradient-contrast";
import {
  buildReport,
  contrastTable,
  focusTable,
  gradientTable,
  contrastHtmlTable,
  escapeHtml,
  paletteVisionTable,
  reportToHtml,
  reportToMarkdown,
  type A11yReportInput,
} from "@/lib/a11y/report";
import { motionSection } from "@/lib/a11y/motion";
import { textSpacingSection } from "@/lib/a11y/text-spacing";
import { targetsSection } from "@/lib/a11y/targets";
import { paletteVisionSection, visionSection } from "@/lib/a11y/vision";
import { defaultGradient } from "@/lib/color/gradient";
import { effectDefaults } from "@/lib/effects/defaults";

const input: A11yReportInput = {
  colors: { text: "#111111", background: "#ffffff", accent: "#8ab4f8", onAccent: "#ffffff" },
  focusRing: "#6366f1",
  typography: {
    family: "Inter",
    size: 16,
    lineHeight: 1.5,
    letterSpacing: 0,
    wordSpacing: 0,
    weight: 400,
    measure: 640,
  },
  targets: [{ id: "a", label: "Icon | button", width: 20, height: 20 }],
  targetGap: 8,
  palette: [
    { name: "Red", hex: "#e53935" },
    { name: "Green", hex: "#43a047" },
    { name: "Blue", hex: "#1e88e5" },
  ],
};

const report = buildReport(input, {
  contrast: contrastSection(input.colors),
  focusIndicator: focusSection(focusIndicatorCheck(input.focusRing, input.colors.background, input.colors.accent)),
  gradientText: gradientSection(defaultGradient, gradientTextContrast(defaultGradient, gradientTextColors("#1f2937"))),
  vision: visionSection(input.colors),
  paletteVision: paletteVisionSection(input.palette),
  readability: { charactersPerLine: 70, readingEase: 64, gradeLevel: 8, checks: [] },
  textSpacing: textSpacingSection(input.typography),
  motion: motionSection(effectDefaults),
  touchTargets: targetsSection(input.targets, input.targetGap),
});

const rows = (markdown: string) => markdown.split("\n").map((line) => line.split(/(?<!\\)\|/).map((c) => c.trim()));

describe("contrastTable", () => {
  const section = report.sections.contrast;
  const lines = contrastTable(section).split("\n");

  test("is a GitHub table with a header, a divider and one row per pair", () => {
    expect(lines).toHaveLength(2 + section.length);
    expect(lines[1]).toMatch(/^\| (--- \| )+---\s\|$/);
    const columns = rows(lines[0])[0].length;
    for (const line of rows(lines.join("\n"))) expect(line).toHaveLength(columns);
  });

  test("shows the same ratio, AA/AAA marks and APCA Lc as the JSON", () => {
    section.forEach((pair, index) => {
      const [, check, colors, ratio, required, result, aa, aaLarge, aaa, aaaLarge, lc, apca] = rows(
        lines[index + 2],
      )[0];
      expect(check).toBe(pair.check);
      expect(colors).toBe(`\`${pair.foreground}\` on \`${pair.background}\``);
      expect(ratio).toBe(`${pair.ratio.toFixed(2)}:1`);
      expect(required).toBe(`${pair.required.toFixed(2)}:1`);
      expect(result.startsWith(pair.pass ? "✅ Pass" : "❌ Fail")).toBe(true);
      expect(aa).toBe(pair.wcag.AA ? "✅ Pass" : "❌ Fail");
      expect(aaLarge).toBe(pair.wcag["AA large"] ? "✅ Pass" : "❌ Fail");
      expect(aaa).toBe(pair.wcag.AAA ? "✅ Pass" : "❌ Fail");
      expect(aaaLarge).toBe(pair.wcag["AAA large"] ? "✅ Pass" : "❌ Fail");
      expect(lc).toBe(`${pair.apca.lc} (min ${pair.apca.target})`);
      expect(apca).toBe(pair.apca.pass ? "✅ Pass" : "❌ Fail");
    });
  });

  test("marks a failing pair and its suggested fix", () => {
    const failing = section.find((pair) => !pair.pass);
    expect(failing?.suggestion).toBeTruthy();
    expect(contrastTable(section)).toContain(`❌ Fail (try \`${failing?.suggestion}\`)`);
  });
});

describe("focusTable", () => {
  test("shows both ring ratios and the verdict from the JSON", () => {
    const focus = report.sections.focusIndicator;
    const [, check, ring, background, component, required, result] = rows(focusTable(focus).split("\n")[2])[0];
    expect(check).toBe(focus.check);
    expect(ring).toBe("`#6366f1`");
    expect(background).toBe(`${focus.ratioAgainstBackground.toFixed(2)}:1 on \`#ffffff\``);
    expect(component).toBe(`${focus.ratioAgainstComponent.toFixed(2)}:1 on \`#8ab4f8\``);
    expect(required).toBe("3.00:1");
    expect(result.startsWith(focus.pass ? "✅ Pass" : "❌ Fail")).toBe(true);
  });
});

describe("gradientTable", () => {
  test("has one row per text color with the worst ratio and where it is", () => {
    const section = report.sections.gradientText;
    const lines = gradientTable(section).split("\n");
    expect(lines).toHaveLength(2 + 3);
    section.results.forEach((item, index) => {
      const [, text, worst, where, background, required, result] = rows(lines[index + 2])[0];
      expect(text).toBe(`${item.text} \`${item.color}\``);
      expect(worst).toBe(`${item.worstRatio.toFixed(2)}:1`);
      expect(where).toBe(`${item.worstPosition}%`);
      expect(background).toBe(`\`${item.worstBackground}\``);
      expect(required).toBe("4.50:1");
      expect(result).toBe(item.pass ? "✅ Pass" : "❌ Fail");
    });
  });
});

describe("paletteVisionTable", () => {
  test("lists each confusable pair with the same numbers as the JSON", () => {
    const section = report.sections.paletteVision;
    const pairs = section.modes.flatMap((mode) => mode.pairs.map((pair) => ({ mode: mode.mode, pair })));
    const lines = paletteVisionTable(section).split("\n");
    expect(lines).toHaveLength(2 + pairs.length);
    const deuteranopia = pairs.findIndex(({ mode }) => mode === "deuteranopia");
    expect(deuteranopia).toBeGreaterThanOrEqual(0);
    const { pair } = pairs[deuteranopia];
    const [, mode, colors, distance, typical, required, result, suggestion] = rows(lines[deuteranopia + 2])[0];
    expect(mode).toBe("deuteranopia");
    expect(colors).toBe("Red `#e53935` and Green `#43a047`");
    expect(distance).toBe(pair.distance.toFixed(3));
    expect(typical).toBe(pair.typicalDistance.toFixed(3));
    expect(required).toBe("0.060");
    expect(result).toBe("❌ Fail");
    expect(suggestion).toBe(
      `Change ${pair.suggestion?.color} to \`${pair.suggestion?.to}\` (${pair.suggestion?.distance.toFixed(3)})`,
    );
  });

  test("the JSON report carries the check", () => {
    const json = JSON.parse(JSON.stringify(report));
    expect(json.sections.paletteVision.threshold).toBe(0.06);
    expect(json.sections.paletteVision.pass).toBe(false);
  });
});

describe("reportToMarkdown", () => {
  const markdown = reportToMarkdown({ ...report, generatedAt: "2026-01-01T00:00:00.000Z" });

  test("has a heading per section", () => {
    const headings = markdown.split("\n").filter((line) => line.startsWith("#"));
    expect(headings).toEqual([
      "# Accessibility report",
      "## Settings",
      "## Contrast",
      "## Focus indicator",
      "## Text on the brand gradient",
      "## Color vision",
      "## Palette under color vision",
      "## Readability",
      "## WCAG 1.4.12 Text Spacing (AA)",
      "## Reduced motion (prefers-reduced-motion)",
      "## Touch targets",
    ]);
    expect(markdown).toContain("2026-01-01T00:00:00.000Z");
  });

  test("escapes pipes so labels cannot break a table", () => {
    expect(markdown).toContain("Icon \\| button");
  });
});

describe("reportToHtml", () => {
  const page = reportToHtml({ ...report, generatedAt: "2026-01-01T00:00:00.000Z" });

  test("is a standalone page with no scripts, one h1 and a caption on every table", () => {
    expect(page.startsWith("<!doctype html>")).toBe(true);
    expect(page).toContain(`<html lang="en">`);
    expect(page).not.toMatch(/<script|<link|<img|javascript:/i);
    expect(page.match(/<h1>/g)).toHaveLength(1);
    const tables = page.match(/<table>/g) ?? [];
    expect(tables.length).toBeGreaterThanOrEqual(7);
    expect(page.match(/<caption>/g)).toHaveLength(tables.length);
    expect(page).toContain("2026-01-01T00:00:00.000Z");
  });

  test("has a heading per section, like the Markdown", () => {
    const headings = [...page.matchAll(/<h2 id="[a-z-]+">([^<]+)<\/h2>/g)].map((match) => match[1]);
    const markdownHeadings = reportToMarkdown(report)
      .split("\n")
      .filter((line) => line.startsWith("## "))
      .map((line) => line.slice(3));
    expect(headings).toEqual(markdownHeadings);
  });

  test("the contrast table has header cells and the same numbers as the JSON", () => {
    const section = report.sections.contrast;
    const table = contrastHtmlTable(section);
    expect(table).toContain("<caption>Contrast of each color pair</caption>");
    expect(table.match(/<th scope="col">/g)).toHaveLength(11);
    const bodyRows = table
      .split("<tbody>")[1]!
      .split("</tr>")
      .filter((row) => row.includes("<tr>"));
    expect(bodyRows).toHaveLength(section.length);
    section.forEach((pair, index) => {
      const row = bodyRows[index]!;
      expect(row).toContain(`<th scope="row">${escapeHtml(pair.check)}</th>`);
      expect(row).toContain(`<td>${pair.ratio.toFixed(2)}:1</td>`);
      expect(row).toContain(`<td>${pair.required.toFixed(2)}:1</td>`);
      expect(row).toContain(`<td>${pair.apca.lc} (min ${pair.apca.target})</td>`);
      expect(row).toContain(`<code>${pair.foreground}</code>`);
      expect(row).toContain(`<span class="badge ${pair.pass ? "pass" : "fail"}">${pair.pass ? "Pass" : "Fail"}</span>`);
    });
  });

  test("escapes labels so they cannot inject markup", () => {
    const hostile = reportToHtml(
      buildReport(input, {
        ...report.sections,
        touchTargets: targetsSection([{ id: "x", label: "<b onclick=1>Icon</b> & co", width: 20, height: 20 }], 8),
      }),
    );
    expect(hostile).toContain("&lt;b onclick=1&gt;Icon&lt;/b&gt; &amp; co");
    expect(hostile).not.toContain("<b onclick");
  });
});

describe("text spacing in the report", () => {
  test("Markdown and HTML list each property against the WCAG 1.4.12 minimum", () => {
    const markdown = reportToMarkdown(report);
    expect(markdown).toContain("## WCAG 1.4.12 Text Spacing (AA)");
    expect(markdown).toContain("| Letter spacing | 0.12em | 0em | ❌ Fail |");
    expect(markdown).toContain("| Line height | 1.5 | 1.5 | ✅ Pass |");
    const html = reportToHtml(report);
    expect(html).toContain('<h2 id="text-spacing">WCAG 1.4.12 Text Spacing (AA)</h2>');
    expect(html).toContain("Text spacing against WCAG 1.4.12");
  });

  test("the JSON report carries the section", () => {
    expect(report.sections.textSpacing.checks.map((item) => item.pass)).toEqual([true, false, false]);
  });
});

describe("motion in the report", () => {
  test("Markdown and HTML list each moving effect with its reduced-motion result", () => {
    const markdown = reportToMarkdown(report);
    expect(markdown).toContain("## Reduced motion (prefers-reduced-motion)");
    expect(markdown).toContain("| Effect | What moves | Reduced-motion rule | Result |");
    expect(markdown).toContain("| Skeleton | Animation | Yes | ✅ Pass |");
    expect(markdown).toContain("| Button press | Transform transition | Yes | ✅ Pass |");
    const html = reportToHtml(report);
    expect(html).toContain('<h2 id="motion">Reduced motion (prefers-reduced-motion)</h2>');
    expect(html).toContain('<th scope="row">Skeleton</th>');
    expect(html).toContain("Effects that move and their reduced-motion rule");
  });

  test("a moving effect without a reduced-motion rule fails in both reports", () => {
    const failing = {
      ...report.sections.motion,
      pass: false,
      checks: [{ check: "Spinner", motion: "Animation", reducedMotionRule: false, pass: false }],
    };
    const changed = buildReport(input, { ...report.sections, motion: failing });
    expect(reportToMarkdown(changed)).toContain("| Spinner | Animation | No | ❌ Fail |");
    expect(reportToHtml(changed)).toContain('<span class="badge fail">Fail</span>');
  });

  test("says so when nothing moves", () => {
    const none = buildReport(input, {
      ...report.sections,
      motion: { ...report.sections.motion, pass: true, checks: [] },
    });
    expect(reportToMarkdown(none)).toContain("no effect moves with the current Effects Lab settings");
    expect(reportToHtml(none)).toContain("No effect moves with the current Effects Lab settings.");
  });
});
