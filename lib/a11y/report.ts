import type { contrastSection, focusSection } from "@/lib/a11y/contrast";
import type { gradientSection } from "@/lib/a11y/gradient-contrast";
import type { Verdict } from "@/lib/a11y/readability";
import type { targetsSection } from "@/lib/a11y/targets";
import type { PaletteColor, PaletteVisionSection, visionSection } from "@/lib/a11y/vision";
import type { A11yColors, A11yTypography, TouchTarget } from "@/types/a11y";

export type A11yReportInput = {
  colors: A11yColors;
  /** The focus ring being checked: the brand primary, or the lab's override. */
  focusRing: string;
  typography: A11yTypography;
  targets: TouchTarget[];
  targetGap: number;
  /** The brand palette from Color Studio, checked for colors that collapse under color blindness. */
  palette: PaletteColor[];
};

export type A11yReportSections = {
  contrast: ReturnType<typeof contrastSection>;
  focusIndicator: ReturnType<typeof focusSection>;
  gradientText: ReturnType<typeof gradientSection>;
  vision: ReturnType<typeof visionSection>;
  paletteVision: PaletteVisionSection;
  readability: {
    charactersPerLine: number;
    readingEase: number;
    gradeLevel: number;
    checks: { check: string; value: string; verdict: Verdict }[];
  };
  touchTargets: ReturnType<typeof targetsSection>;
};

export type A11yReport = {
  tool: "DesignHub Accessibility Lab";
  /** Stamped at download time so server and client renders stay identical. */
  generatedAt?: string;
  settings: A11yReportInput;
  sections: A11yReportSections;
};

/** Collects every check into one JSON document. Sections are contributed by each tool. */
export function buildReport(input: A11yReportInput, sections: A11yReportSections): A11yReport {
  return { tool: "DesignHub Accessibility Lab", settings: input, sections };
}

export function stampReport(report: A11yReport): string {
  return `${JSON.stringify({ ...report, generatedAt: new Date().toISOString() }, null, 2)}\n`;
}

export function stampMarkdown(report: A11yReport): string {
  return reportToMarkdown({ ...report, generatedAt: new Date().toISOString() });
}

const mark = (pass: boolean) => (pass ? "✅ Pass" : "❌ Fail");
const verdictMark: Record<Verdict, string> = { pass: "✅ Pass", warn: "⚠️ Warn", fail: "❌ Fail" };

/** Escapes what would break a GitHub table cell: pipes and line breaks. */
function cell(value: string | number): string {
  return String(value).replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function table(head: string[], rows: (string | number)[][]): string {
  const line = (cells: (string | number)[]) => `| ${cells.map(cell).join(" | ")} |`;
  return [line(head), `| ${head.map(() => "---").join(" | ")} |`, ...rows.map(line)].join("\n");
}

const code = (value: string) => `\`${value.replace(/`/g, "")}\``;
const ratio = (value: number) => `${value.toFixed(2)}:1`;

/** One row per contrast pair, with the same rounded numbers as the JSON report. */
export function contrastTable(rows: A11yReportSections["contrast"]): string {
  return table(
    ["Check", "Colors", "Ratio", "Required", "Result", "AA", "AA large", "AAA", "AAA large", "APCA Lc", "APCA"],
    rows.map((row) => [
      row.check,
      `${code(row.foreground)} on ${code(row.background)}`,
      ratio(row.ratio),
      ratio(row.required),
      mark(row.pass) + (row.suggestion ? ` (try ${code(row.suggestion)})` : ""),
      mark(row.wcag.AA),
      mark(row.wcag["AA large"]),
      mark(row.wcag.AAA),
      mark(row.wcag["AAA large"]),
      `${row.apca.lc} (min ${row.apca.target})`,
      mark(row.apca.pass),
    ]),
  );
}

/** The ring against the page and against the focused button, each needing 3:1. */
export function focusTable(focus: A11yReportSections["focusIndicator"]): string {
  return table(
    ["Check", "Ring", "vs background", "vs component", "Required", "Result"],
    [
      [
        focus.check,
        code(focus.ring),
        `${ratio(focus.ratioAgainstBackground)} on ${code(focus.background)}`,
        `${ratio(focus.ratioAgainstComponent)} on ${code(focus.component)}`,
        ratio(focus.required),
        mark(focus.pass) + (focus.suggestion ? ` (try ${code(focus.suggestion)})` : ""),
      ],
    ],
  );
}

/** The lowest contrast of each text color anywhere on the gradient, and where it is. */
export function gradientTable(gradient: A11yReportSections["gradientText"]): string {
  return table(
    ["Text", "Worst ratio", "Where", "Gradient there", "Required", "Result", "AA large"],
    gradient.results.map((row) => [
      `${row.text} ${code(row.color)}`,
      ratio(row.worstRatio),
      `${row.worstPosition}%`,
      code(row.worstBackground),
      ratio(row.required),
      mark(row.pass),
      mark(row.passLarge),
    ]),
  );
}

/** One row per palette pair that becomes too similar under a simulation, with its lightness fix. */
export function paletteVisionTable(section: PaletteVisionSection): string {
  return table(
    ["Mode", "Colors", "Distance", "Typical vision", "Required", "Result", "Suggestion"],
    section.modes.flatMap((mode) =>
      mode.pairs.map((pair) => [
        mode.mode,
        `${pair.a.name} ${code(pair.a.hex)} and ${pair.b.name} ${code(pair.b.hex)}`,
        pair.distance.toFixed(3),
        pair.typicalDistance.toFixed(3),
        section.threshold.toFixed(3),
        mark(false),
        pair.suggestion
          ? `Change ${pair.suggestion.color} to ${code(pair.suggestion.to)} (${pair.suggestion.distance.toFixed(3)})`
          : "Pick a different hue",
      ]),
    ),
  );
}

function paletteVisionMarkdown(section: PaletteVisionSection): string {
  const checked = section.colors.map((color) => `${color.name} ${code(color.hex)}`).join(", ");
  const intro = `OKLab distance (ΔE OK) between each pair of palette colors after simulating each type of color vision. Pairs below ${section.threshold} are hard to tell apart in charts and status colors. Checked: ${checked || "no colors"}.`;
  if (section.pass) {
    return `${intro}\n\n${mark(true)}: every pair stays distinguishable under ${section.modes.map((mode) => mode.mode).join(", ")}.`;
  }
  return `${intro}\n\n${paletteVisionTable(section)}`;
}

/** The same report as readable Markdown for pull requests and wikis. */
export function reportToMarkdown(report: A11yReport): string {
  const { settings, sections } = report;
  const { colors, typography } = settings;
  const visionPairs = sections.vision[0]?.pairs ?? [];
  const parts = [
    "# Accessibility report",
    `Generated by ${report.tool}${report.generatedAt ? ` on ${report.generatedAt}` : ""}.`,
    "## Settings",
    table(
      ["Setting", "Value"],
      [
        ["Text", code(colors.text)],
        ["Background", code(colors.background)],
        ["Accent", code(colors.accent)],
        ["On accent", code(colors.onAccent)],
        ["Focus ring", code(settings.focusRing)],
        ["Font", typography.family],
        ["Size", `${typography.size}px`],
        ["Weight", typography.weight],
        ["Line height", typography.lineHeight],
        ["Letter spacing", `${typography.letterSpacing}em`],
        ["Word spacing", `${typography.wordSpacing}em`],
        ["Measure", `${typography.measure}px`],
      ],
    ),
    "## Contrast",
    contrastTable(sections.contrast),
    sections.contrast[0] ? `> ${sections.contrast[0].apca.note}` : "",
    "## Focus indicator",
    focusTable(sections.focusIndicator),
    "## Text on the brand gradient",
    `${sections.gradientText.samples} points sampled along ${code(sections.gradientText.gradient)} in ${sections.gradientText.interpolation}. Each row is the lowest contrast anywhere on it.`,
    gradientTable(sections.gradientText),
    "## Color vision",
    "Contrast after simulating each type of color vision. AA needs 4.5:1.",
    table(
      ["Mode", ...visionPairs.map((item) => item.check)],
      sections.vision.map((mode) => [
        mode.mode,
        ...mode.pairs.map((item) => `${ratio(item.ratio)} ${item.passAA ? "✅" : "❌"}`),
      ]),
    ),
    "## Palette under color vision",
    paletteVisionMarkdown(sections.paletteVision),
    "## Readability",
    `Characters per line: ${sections.readability.charactersPerLine}. Reading ease: ${sections.readability.readingEase}. Grade level: ${sections.readability.gradeLevel}.`,
    table(
      ["Check", "Value", "Result"],
      sections.readability.checks.map((item) => [item.check, item.value, verdictMark[item.verdict]]),
    ),
    "## Touch targets",
    `Gap between targets: ${sections.touchTargets.gap}px.`,
    table(
      ["Target", "Size", "WCAG 2.5.8 (AA)", "WCAG 2.5.5 (AAA)", "Note"],
      sections.touchTargets.results.map((item) => [
        item.label,
        item.size,
        mark(item["WCAG 2.5.8 (AA)"]),
        mark(item["WCAG 2.5.5 (AAA)"]),
        item.note,
      ]),
    ),
  ];
  return `${parts.filter(Boolean).join("\n\n")}\n`;
}

// The HTML report below mirrors the Markdown one: the same sections and the same rounded numbers,
// as a standalone page.

/** Escapes text for HTML content and attribute values. */
export function escapeHtml(value: string | number): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const HEX = /^#[0-9a-f]{3,8}$/i;

/** A color's hex as monospace text with a small swatch. The swatch is decoration: the hex is the content. */
function chip(hex: string): string {
  const swatch = HEX.test(hex) ? `<span class="chip" style="background:${hex}" aria-hidden="true"></span>` : "";
  return `${swatch}<code>${escapeHtml(hex)}</code>`;
}

/** Pass, warn or fail as a word, so the result never depends on color alone. */
function badge(verdict: Verdict): string {
  const label = { pass: "Pass", warn: "Warn", fail: "Fail" }[verdict];
  return `<span class="badge ${verdict}">${label}</span>`;
}
const passBadge = (pass: boolean) => badge(pass ? "pass" : "fail");

/** Table cell content: plain strings and numbers are escaped, `{ html }` is already markup. */
type HtmlCell = string | number | { html: string };

const cellHtml = (value: HtmlCell) => (typeof value === "object" ? value.html : escapeHtml(value));
const html = (value: string): HtmlCell => ({ html: value });

/** A table with a caption, column headers, and the first column as row headers. */
function htmlTable(caption: string, head: string[], rows: HtmlCell[][]): string {
  const header = head.map((item) => `<th scope="col">${escapeHtml(item)}</th>`).join("");
  const body = rows
    .map(
      (row) =>
        `<tr>${row
          .map((item, index) => (index === 0 ? `<th scope="row">${cellHtml(item)}</th>` : `<td>${cellHtml(item)}</td>`))
          .join("")}</tr>`,
    )
    .join("\n");
  // Wide tables scroll inside a focusable, named region so keyboard users can reach every column.
  return `<div class="scroll" role="region" aria-label="${escapeHtml(caption)}" tabindex="0">
<table>
<caption>${escapeHtml(caption)}</caption>
<thead><tr>${header}</tr></thead>
<tbody>
${body}
</tbody>
</table>
</div>`;
}

const suggestion = (value: string | null | undefined) => (value ? ` (try ${chip(value)})` : "");

/** One row per contrast pair, with the same rounded numbers as the JSON report. */
export function contrastHtmlTable(rows: A11yReportSections["contrast"]): string {
  return htmlTable(
    "Contrast of each color pair",
    ["Check", "Colors", "Ratio", "Required", "Result", "AA", "AA large", "AAA", "AAA large", "APCA Lc", "APCA"],
    rows.map((row) => [
      row.check,
      html(`${chip(row.foreground)} on ${chip(row.background)}`),
      ratio(row.ratio),
      ratio(row.required),
      html(passBadge(row.pass) + suggestion(row.suggestion)),
      html(passBadge(row.wcag.AA)),
      html(passBadge(row.wcag["AA large"])),
      html(passBadge(row.wcag.AAA)),
      html(passBadge(row.wcag["AAA large"])),
      `${row.apca.lc} (min ${row.apca.target})`,
      html(passBadge(row.apca.pass)),
    ]),
  );
}

export function focusHtmlTable(focus: A11yReportSections["focusIndicator"]): string {
  return htmlTable(
    "Focus indicator contrast",
    ["Check", "Ring", "vs background", "vs component", "Required", "Result"],
    [
      [
        focus.check,
        html(chip(focus.ring)),
        html(`${ratio(focus.ratioAgainstBackground)} on ${chip(focus.background)}`),
        html(`${ratio(focus.ratioAgainstComponent)} on ${chip(focus.component)}`),
        ratio(focus.required),
        html(passBadge(focus.pass) + suggestion(focus.suggestion)),
      ],
    ],
  );
}

export function gradientHtmlTable(gradient: A11yReportSections["gradientText"]): string {
  return htmlTable(
    "Lowest contrast of each text color on the brand gradient",
    ["Text", "Worst ratio", "Where", "Gradient there", "Required", "Result", "AA large"],
    gradient.results.map((row) => [
      html(`${escapeHtml(row.text)} ${chip(row.color)}`),
      ratio(row.worstRatio),
      `${row.worstPosition}%`,
      html(chip(row.worstBackground)),
      ratio(row.required),
      html(passBadge(row.pass)),
      html(passBadge(row.passLarge)),
    ]),
  );
}

export function paletteVisionHtmlTable(section: PaletteVisionSection): string {
  return htmlTable(
    "Palette pairs that are hard to tell apart under color blindness",
    ["Mode", "Colors", "Distance", "Typical vision", "Required", "Result", "Suggestion"],
    section.modes.flatMap((mode) =>
      mode.pairs.map((pair) => [
        mode.mode,
        html(`${escapeHtml(pair.a.name)} ${chip(pair.a.hex)} and ${escapeHtml(pair.b.name)} ${chip(pair.b.hex)}`),
        pair.distance.toFixed(3),
        pair.typicalDistance.toFixed(3),
        section.threshold.toFixed(3),
        html(passBadge(false)),
        pair.suggestion
          ? html(
              `Change ${escapeHtml(pair.suggestion.color)} to ${chip(pair.suggestion.to)} (${pair.suggestion.distance.toFixed(3)})`,
            )
          : "Pick a different hue",
      ]),
    ),
  );
}

function paletteVisionHtml(section: PaletteVisionSection): string {
  const checked = section.colors.map((color) => `${escapeHtml(color.name)} ${chip(color.hex)}`).join(", ");
  const intro = `<p>OKLab distance (&Delta;E OK) between each pair of palette colors after simulating each type of color vision. Pairs below ${section.threshold} are hard to tell apart in charts and status colors. Checked: ${checked || "no colors"}.</p>`;
  if (section.pass) {
    const modes = escapeHtml(section.modes.map((mode) => mode.mode).join(", "));
    return `${intro}\n<p>${passBadge(true)} Every pair stays distinguishable under ${modes}.</p>`;
  }
  return `${intro}\n${paletteVisionHtmlTable(section)}`;
}

const reportCss = `
:root { color-scheme: light; }
* { box-sizing: border-box; }
body { margin: 0; background: #ffffff; color: #1a1a1a; font: 16px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
main { max-width: 72rem; margin: 0 auto; padding: 2rem 1rem 4rem; }
h1 { margin: 0 0 0.25rem; font-size: 2rem; line-height: 1.2; }
h2 { margin: 2.5rem 0 0.75rem; padding-top: 1rem; border-top: 1px solid #d4d4d8; font-size: 1.375rem; line-height: 1.3; }
p { margin: 0.5rem 0; max-width: 65ch; }
.meta { color: #3f3f46; }
.scroll { overflow-x: auto; margin: 1rem 0; border: 1px solid #a1a1aa; border-radius: 0.5rem; }
.scroll:focus-visible { outline: 3px solid #1d4ed8; outline-offset: 2px; }
table { width: 100%; border-collapse: collapse; font-size: 0.9375rem; }
caption { padding: 0.75rem; text-align: left; font-weight: 600; background: #f4f4f5; }
th, td { padding: 0.5rem 0.75rem; border-top: 1px solid #d4d4d8; text-align: left; vertical-align: top; }
thead th { background: #e4e4e7; white-space: nowrap; }
tbody th { font-weight: 600; }
code { font: 0.875em ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; white-space: nowrap; }
.chip { display: inline-block; width: 1rem; height: 1rem; margin-right: 0.375rem; vertical-align: -0.125rem; border: 1px solid #52525b; border-radius: 0.25rem; }
.badge { display: inline-block; padding: 0 0.5rem; border: 1px solid currentColor; border-radius: 999px; font-size: 0.8125rem; font-weight: 700; white-space: nowrap; }
.badge.pass { background: #dcfce7; color: #14532d; }
.badge.warn { background: #fef3c7; color: #713f12; }
.badge.fail { background: #fee2e2; color: #7f1d1d; }
@media print { .scroll { overflow: visible; } }
`;

/** The same report as a standalone HTML page: inline CSS, no scripts, semantic tables with captions. */
export function reportToHtml(report: A11yReport): string {
  const { settings, sections } = report;
  const { colors, typography } = settings;
  const visionPairs = sections.vision[0]?.pairs ?? [];
  const stamp = report.generatedAt ? ` on ${escapeHtml(report.generatedAt)}` : "";
  const readability = sections.readability;
  const parts = [
    `<h1>Accessibility report</h1>
<p class="meta">Generated by ${escapeHtml(report.tool)}${stamp}.</p>`,
    `<h2 id="settings">Settings</h2>
${htmlTable(
  "Settings that were checked",
  ["Setting", "Value"],
  [
    ["Text", html(chip(colors.text))],
    ["Background", html(chip(colors.background))],
    ["Accent", html(chip(colors.accent))],
    ["On accent", html(chip(colors.onAccent))],
    ["Focus ring", html(chip(settings.focusRing))],
    ["Font", typography.family],
    ["Size", `${typography.size}px`],
    ["Weight", typography.weight],
    ["Line height", typography.lineHeight],
    ["Letter spacing", `${typography.letterSpacing}em`],
    ["Word spacing", `${typography.wordSpacing}em`],
    ["Measure", `${typography.measure}px`],
  ],
)}`,
    `<h2 id="contrast">Contrast</h2>
${contrastHtmlTable(sections.contrast)}${sections.contrast[0] ? `\n<p>${escapeHtml(sections.contrast[0].apca.note)}</p>` : ""}`,
    `<h2 id="focus">Focus indicator</h2>
${focusHtmlTable(sections.focusIndicator)}`,
    `<h2 id="gradient">Text on the brand gradient</h2>
<p>${sections.gradientText.samples} points sampled along <code>${escapeHtml(sections.gradientText.gradient)}</code> in ${escapeHtml(sections.gradientText.interpolation)}. Each row is the lowest contrast anywhere on it.</p>
${gradientHtmlTable(sections.gradientText)}`,
    `<h2 id="vision">Color vision</h2>
<p>Contrast after simulating each type of color vision. AA needs 4.5:1.</p>
${htmlTable(
  "Contrast under each type of color vision",
  ["Mode", ...visionPairs.map((item) => item.check)],
  sections.vision.map((mode) => [
    mode.mode,
    ...mode.pairs.map((item) => html(`${ratio(item.ratio)} ${passBadge(item.passAA)}`)),
  ]),
)}`,
    `<h2 id="palette-vision">Palette under color vision</h2>
${paletteVisionHtml(sections.paletteVision)}`,
    `<h2 id="readability">Readability</h2>
<p>Characters per line: ${readability.charactersPerLine}. Reading ease: ${readability.readingEase}. Grade level: ${readability.gradeLevel}.</p>
${htmlTable(
  "Readability checks",
  ["Check", "Value", "Result"],
  readability.checks.map((item) => [item.check, item.value, html(badge(item.verdict))]),
)}`,
    `<h2 id="targets">Touch targets</h2>
<p>Gap between targets: ${sections.touchTargets.gap}px.</p>
${htmlTable(
  "Touch target sizes",
  ["Target", "Size", "WCAG 2.5.8 (AA)", "WCAG 2.5.5 (AAA)", "Note"],
  sections.touchTargets.results.map((item) => [
    item.label,
    item.size,
    html(passBadge(item["WCAG 2.5.8 (AA)"])),
    html(passBadge(item["WCAG 2.5.5 (AAA)"])),
    item.note,
  ]),
)}`,
  ];
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Accessibility report</title>
<style>${reportCss}</style>
</head>
<body>
<main>
${parts.join("\n")}
</main>
</body>
</html>
`;
}

export function stampHtml(report: A11yReport): string {
  return reportToHtml({ ...report, generatedAt: new Date().toISOString() });
}
