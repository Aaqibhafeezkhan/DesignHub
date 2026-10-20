import { describe, expect, test } from "vitest";

import { brandMarkdownFiles, mdAnchor, mdEscape, MARKDOWN_FILENAME } from "@/lib/guidelines/markdown";
import { guidelineContext } from "@/lib/guidelines/test-context";

function markdown(excluded: string[] = [], name = "Acme Labs") {
  const { ctx, pages } = guidelineContext(name, excluded);
  const files = new Map(brandMarkdownFiles(ctx, pages).map((entry) => [entry.name, String(entry.data)]));
  return { ctx, pages, files, md: files.get(MARKDOWN_FILENAME) ?? "" };
}

describe("brand book Markdown", () => {
  test("has a heading per page in the PDF's order and numbering", () => {
    const { ctx, md } = markdown();
    const headings = [...md.matchAll(/^## (\d+)\. (.+)$/gm)].map((match) => [Number(match[1]), match[2]]);
    expect(headings).toEqual(ctx.contents.map((entry) => [entry.number, mdEscape(entry.title)]));
    expect(md.startsWith("# Acme Labs brand guidelines")).toBe(true);
  });

  test("leaves switched-off pages out of the headings, contents and files", () => {
    const { md, files } = markdown(["imagery", "voice"]);
    expect(md).not.toContain("Voice");
    expect(files.has("assets/pages/voice.svg")).toBe(false);
    expect(files.has("assets/pages/imagery.svg")).toBe(false);
    const numbers = [...md.matchAll(/^## (\d+)\. /gm)].map((match) => Number(match[1]));
    expect(numbers).toEqual(numbers.map((_, i) => i + 1));
  });

  test("links every contents entry to a heading that exists", () => {
    const { md } = markdown();
    const anchors = new Set([...md.matchAll(/^## (.+)$/gm)].map((match) => mdAnchor(match[1]!.replace(/\\/g, ""))));
    const links = [...md.matchAll(/^- \[[^\]]+\]\(#([^)]+)\)$/gm)].map((match) => match[1]!);
    expect(links.length).toBeGreaterThan(5);
    for (const link of links) expect(anchors.has(link), link).toBe(true);
  });

  test("writes a GitHub table for the palette and for the logo files", () => {
    const { md, ctx } = markdown();
    expect(md).toContain("| Color | Hex | Role |\n| --- | --- | --- |");
    const first = ctx.brand.colors.all[0]!;
    expect(md).toContain(`\`${first.hex}\``);
    expect(md).toContain("| Logo | Use | File |\n| --- | --- | --- |");
    const dividers = md.split("\n").filter((line) => /^\| (--- \| )*---/.test(line));
    expect(dividers).toHaveLength(2);
    for (const line of md.split("\n").filter((l) => l.startsWith("| ") && !l.includes("---"))) {
      const columns = line.replace(/\\\|/g, "").split("|").length;
      expect(columns, line).toBe(5);
    }
  });

  test("every image and link target is a relative path to a file in the ZIP", () => {
    const { md, files } = markdown();
    const targets = [...md.matchAll(/\]\((?!#)([^)]+)\)/g)].map((match) => decodeURIComponent(match[1]!));
    expect(targets.length).toBeGreaterThan(10);
    for (const target of targets) {
      expect(target.startsWith("/") || target.includes(":"), target).toBe(false);
      expect(files.has(target), target).toBe(true);
    }
    expect(md).toContain("![The Introduction page](assets/pages/introduction.svg)");
    expect(md).toContain("(logo/acme-labs-color.svg)");
  });

  test("escapes the brand name so it can't break the document", () => {
    const { md } = markdown([], "A | B *[x]* <i>");
    expect(md.split("\n")[0]).toBe("# A \\| B \\*\\[x\\]\\* \\<i\\> brand guidelines");
    expect(md).not.toContain("<i>");
  });
});

describe("mdEscape", () => {
  test("escapes formatting characters and a leading list marker", () => {
    expect(mdEscape("a_b *c* `d` [e] <f> | g")).toBe("a\\_b \\*c\\* \\`d\\` \\[e\\] \\<f\\> \\| g");
    expect(mdEscape("- item")).toBe("\\- item");
    expect(mdEscape("1. item")).toBe("\\1. item");
    expect(mdEscape("two\nlines")).toBe("two lines");
  });
});
