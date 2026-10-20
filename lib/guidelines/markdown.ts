import { CREDIT_TEXT } from "@/lib/export/credit";
import { pageBlocks } from "@/lib/guidelines/site";
import type { GuidelineContext, GuidelinePage } from "@/lib/guidelines/types";
import { slugify } from "@/lib/logo/pack";
import { logoVariants } from "@/lib/logo/variants";
import { createZip, type ZipEntry } from "@/lib/zip";

/** File name of the Markdown document inside the ZIP. */
export const MARKDOWN_FILENAME = "brand-guidelines.md";

/** Escapes what Markdown would read as formatting, HTML or a table cell. */
export function mdEscape(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/([`*_[\]<>|])/g, "\\$1")
    .replace(/^(\s*)([#>+-]|\d+[.)])(\s)/, "$1\\$2$3")
    .replace(/\s*\n\s*/g, " ");
}

/** An image or link target. Spaces and parentheses would end the target early. */
const mdPath = (path: string) => path.replace(/ /g, "%20").replace(/\(/g, "%28").replace(/\)/g, "%29");

const row = (cells: string[]) => `| ${cells.join(" | ")} |`;

/** A GitHub-flavored table: header, divider, rows. */
function table(header: string[], rows: string[][]): string {
  return [row(header), row(header.map(() => "---")), ...rows.map(row)].join("\n");
}

/** GitHub's heading anchor: lowercase, punctuation dropped, spaces to hyphens. */
export function mdAnchor(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s/g, "-");
}

/**
 * The brand book as one Markdown document, for docs sites and wikis: a heading per included page
 * in the PDF's order and numbering, the page's text as paragraphs and sub-headings, the page art
 * as a relative image link, then the palette and the logo files as tables. Returned with the SVG
 * page art and the logo files the links point at, so unzipping it anywhere keeps the images working.
 */
export function brandMarkdownFiles(ctx: GuidelineContext, pages: GuidelinePage[]): ZipEntry[] {
  const base = slugify(ctx.brand.name);
  const entries: ZipEntry[] = [];
  const sections: string[] = [];
  const headings: string[] = [];
  const shownHeadings: string[] = [];

  pages.forEach((page, i) => {
    const number = ctx.contents.find((entry) => entry.id === page.id)?.number ?? i + 1;
    const svg = page.render(ctx, i + 1);
    const art = `assets/pages/${page.id}.svg`;
    entries.push({ name: art, data: svg });
    const heading = `${number}. ${page.title}`;
    const shown = `${number}. ${mdEscape(page.title)}`;
    headings.push(heading);
    shownHeadings.push(shown);
    // The page title is the section heading, so the art's own title (h1) isn't repeated.
    const blocks = pageBlocks(svg).filter((block) => block.tag !== "h1");
    const body = blocks.map((block) => (block.tag === "h2" ? `### ${mdEscape(block.text)}` : mdEscape(block.text)));
    sections.push([`## ${shown}`, `![The ${mdEscape(page.title)} page](${mdPath(art)})`, ...body].join("\n\n"));
  });

  const logos = logoVariants.map((variant) => ({
    variant,
    path: `logo/${base}-${variant.id}.svg`,
    svg: variant.render(ctx.logo),
  }));
  entries.push(...logos.map((logo) => ({ name: logo.path, data: logo.svg })));

  const palette = table(
    ["Color", "Hex", "Role"],
    ctx.brand.colors.all.map((color) => [mdEscape(color.name), `\`${color.hex}\``, mdEscape(color.role)]),
  );
  const files = table(
    ["Logo", "Use", "File"],
    logos.map(({ variant, path }) => [
      mdEscape(variant.label),
      mdEscape(variant.description),
      `[${mdEscape(`${base}-${variant.id}.svg`)}](${mdPath(path)})`,
    ]),
  );
  const previews = logos
    .filter(({ variant }) => variant.id === "color")
    .map(({ path }) => `![${mdEscape(ctx.brand.name)} logo](${mdPath(path)})`);

  const contents = headings.map((heading, i) => `- [${shownHeadings[i]}](#${mdAnchor(heading)})`);
  const document = [
    `# ${mdEscape(ctx.brand.name)} brand guidelines`,
    ...previews,
    ...(ctx.brand.description ? [mdEscape(ctx.brand.description)] : []),
    `## Contents\n\n${contents.join("\n")}`,
    ...sections,
    `## Color palette\n\n${palette}`,
    `## Logo files\n\n${files}`,
    `---\n\n${mdEscape(CREDIT_TEXT)}`,
  ].join("\n\n");

  return [{ name: MARKDOWN_FILENAME, data: `${document}\n` }, ...entries];
}

export function buildBrandMarkdown(ctx: GuidelineContext, pages: GuidelinePage[]): Uint8Array {
  return createZip(brandMarkdownFiles(ctx, pages));
}
