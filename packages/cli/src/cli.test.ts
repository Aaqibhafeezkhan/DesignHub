import { mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { defaultSnapshot } from "@/lib/projects/snapshot";
import { projectToJson } from "@/lib/projects/transfer";
import { tokenFormats } from "@/lib/tokens/formats";
import { tokensFromSnapshot } from "@/lib/tokens/from-snapshot";
import { loadFontCatalog } from "@/lib/typography/catalog";
import type { BrandProject } from "@/lib/projects/types";

import { buildTokenFiles, listFormats } from "./build";
import { run, type Io } from "./cli";

const project = (name = "Acme Labs"): BrandProject => ({
  id: "p1",
  favorite: false,
  tags: [],
  createdAt: 1,
  updatedAt: 1,
  lastOpenedAt: 1,
  snapshot: defaultSnapshot(name),
});

let dir: string;
let output: { out: string; err: string };
let io: Io;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "designhub-cli-"));
  output = { out: "", err: "" };
  io = { cwd: dir, out: (text) => (output.out += text), err: (text) => (output.err += text) };
  await writeFile(join(dir, "brand.designhub.json"), projectToJson(project()));
});

afterEach(() => rm(dir, { recursive: true, force: true }));

describe("buildTokenFiles", () => {
  test("every format matches what the Export Engine downloads for the same project", async () => {
    const text = projectToJson(project());
    const generatedAt = "2026-01-01T00:00:00.000Z";
    const files = await buildTokenFiles(text, { generatedAt });
    const expected = tokenFormats(
      tokensFromSnapshot(defaultSnapshot("Acme Labs"), await loadFontCatalog(), generatedAt),
    );
    expect(files).toHaveLength(expected.length);
    expected.forEach((format, i) => {
      expect(files[i]!.data, format.id).toBe(format.code);
      expect(files[i]!.path.endsWith(format.filename), format.id).toBe(true);
    });
    // Formats that share a file name (React and Vue write theme.ts) get a folder each, as in the ZIP.
    expect(new Set(files.map((file) => file.path)).size).toBe(files.length);
    expect(files.some((file) => file.path === "react/theme.ts")).toBe(true);
  });

  test("the output is deterministic: the same file builds the same files", async () => {
    const text = projectToJson(project());
    expect(await buildTokenFiles(text)).toEqual(await buildTokenFiles(text));
  });

  test("builds only the formats asked for, in that order", async () => {
    const files = await buildTokenFiles(projectToJson(project()), { formats: ["tailwind-v4", "css"] });
    const formats = await listFormats();
    const name = (id: string) => formats.find((format) => format.id === id)!.filename;
    expect(files.map((file) => file.path)).toEqual([name("tailwind-v4"), name("css")]);
  });

  test("rejects an unknown format and a file that is not a project", async () => {
    await expect(buildTokenFiles(projectToJson(project()), { formats: ["nope"] })).rejects.toThrow(
      'Unknown format "nope"',
    );
    await expect(buildTokenFiles("{ not json")).rejects.toThrow("valid JSON");
    await expect(buildTokenFiles(JSON.stringify({ hello: "world" }))).rejects.toThrow("isn't a DesignHub project");
  });
});

describe("designhub build", () => {
  test("writes the chosen formats to the output folder", async () => {
    const code = await run(["build", "brand.designhub.json", "--format", "css,tailwind-v4", "--out", "tokens"], io);
    expect(code).toBe(0);
    const formats = await listFormats();
    const name = (id: string) => formats.find((format) => format.id === id)!.filename;
    expect((await readdir(join(dir, "tokens"))).sort()).toEqual([name("css"), name("tailwind-v4")].sort());
    expect(output.out).toContain("Wrote 2 files to tokens/");
    expect(await readFile(join(dir, "tokens", name("tailwind-v4")), "utf8")).toContain('@import "tailwindcss";');
  });

  test("builds every format into nested folders when none is chosen", async () => {
    expect(await run(["build", "brand.designhub.json", "-o", "all"], io)).toBe(0);
    const formats = await listFormats();
    expect(output.out).toContain(`Wrote ${formats.length} files`);
    expect((await stat(join(dir, "all", "react", "theme.ts"))).isFile()).toBe(true);
  });

  test("--help lists the formats and exits 0", async () => {
    expect(await run(["--help"], io)).toBe(0);
    for (const format of await listFormats()) expect(output.out).toContain(format.id);
    expect(output.out).toContain("designhub build");
  });

  test("a missing file, an invalid file and an unknown format exit non-zero with a clear message", async () => {
    expect(await run(["build", "missing.json"], io)).toBe(1);
    expect(output.err).toContain('Can\'t read "missing.json"');

    await writeFile(join(dir, "bad.json"), "{ nope");
    output.err = "";
    expect(await run(["build", "bad.json"], io)).toBe(1);
    expect(output.err).toContain("designhub: ");
    expect(output.err).toContain("valid JSON");

    output.err = "";
    expect(await run(["build", "brand.designhub.json", "--format", "bogus"], io)).toBe(1);
    expect(output.err).toContain('Unknown format "bogus"');
    await expect(stat(join(dir, "tokens"))).rejects.toThrow();
  });

  test("bad usage exits 2", async () => {
    expect(await run([], io)).toBe(2);
    expect(await run(["explode", "x"], io)).toBe(2);
    expect(await run(["build"], io)).toBe(2);
    expect(await run(["build", "brand.designhub.json", "--format"], io)).toBe(2);
  });

  test("--version prints the version", async () => {
    expect(await run(["-v"], io)).toBe(0);
    expect(output.out).toMatch(/^\d+\.\d+\.\d+\n$/);
  });
});
