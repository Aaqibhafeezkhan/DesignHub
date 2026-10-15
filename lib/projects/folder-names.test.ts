import { describe, expect, it } from "vitest";

import { fileHoldsProject, folderFileName, isFileOfProject, isSafeFolderFileName } from "@/lib/projects/folder-names";
import { defaultSnapshot } from "@/lib/projects/snapshot";
import { projectToJson } from "@/lib/projects/transfer";
import type { BrandProject } from "@/lib/projects/types";

const project = (name: string, id = "3f2b6c1e-9a4d-4e7a-8c55-0d1f2a3b4c5d") => ({
  id,
  snapshot: defaultSnapshot(name),
});

describe("folderFileName", () => {
  it("joins the slugified name and the id", () => {
    expect(folderFileName(project("Acme Studio!"))).toBe(
      "acme-studio-3f2b6c1e-9a4d-4e7a-8c55-0d1f2a3b4c5d.designhub.json",
    );
  });

  it("falls back to brand for names without letters or digits", () => {
    expect(folderFileName(project("日本語 !!!", "abc"))).toBe("brand-abc.designhub.json");
  });

  it("keeps long names short", () => {
    const name = folderFileName(project("a".repeat(60), "id1"));
    expect(name).toBe(`${"a".repeat(40)}-id1.designhub.json`);
  });

  it("never produces a path segment, whatever the name or id", () => {
    const names = [
      folderFileName(project("../../etc/passwd", "../../x")),
      folderFileName(project("a/b\\c", "..\\..\\y")),
      folderFileName(project("COM1", "a b/c")),
    ];
    for (const name of names) {
      expect(name).not.toMatch(/[\\/]/);
      expect(name.startsWith(".")).toBe(false);
      expect(name).not.toContain("..");
      expect(isSafeFolderFileName(name), name).toBe(true);
    }
  });

  it("uses a placeholder for an id with no usable characters", () => {
    expect(folderFileName(project("Acme", "///"))).toBe("acme-project.designhub.json");
  });

  it("keeps the same file when only the case of the name changes", () => {
    expect(folderFileName(project("ACME", "1"))).toBe(folderFileName(project("acme", "1")));
  });
});

describe("isFileOfProject", () => {
  it("matches the project's files under any earlier name", () => {
    expect(isFileOfProject("old-name-abc.designhub.json", "abc")).toBe(true);
    expect(isFileOfProject("acme-abc.designhub.json", "abc")).toBe(true);
  });

  it("ignores other projects and other files", () => {
    expect(isFileOfProject("acme-xabc.designhub.json", "abc")).toBe(false);
    expect(isFileOfProject("acme-abc.json", "abc")).toBe(false);
    expect(isFileOfProject("notes.txt", "abc")).toBe(false);
  });
});

describe("isSafeFolderFileName", () => {
  it("accepts only single lowercase designhub files", () => {
    expect(isSafeFolderFileName("acme-1.designhub.json")).toBe(true);
    for (const bad of [
      "",
      ".designhub.json",
      "../a.designhub.json",
      "a/b.designhub.json",
      "a.json",
      "A-1.designhub.json",
    ]) {
      expect(isSafeFolderFileName(bad), bad).toBe(false);
    }
  });
});

describe("fileHoldsProject", () => {
  const full = (name: string): BrandProject => ({
    ...project(name),
    favorite: false,
    tags: [],
    createdAt: 1,
    updatedAt: 2,
    lastOpenedAt: 3,
  });

  it("is true for the same project exported at another time", () => {
    const text = projectToJson(full("Acme")).replace(
      /"exportedAt": "[^"]+"/,
      '"exportedAt": "2001-01-01T00:00:00.000Z"',
    );
    expect(fileHoldsProject(text, full("Acme"))).toBe(true);
  });

  it("is false once the brand or the metadata changed", () => {
    const text = projectToJson(full("Acme"));
    expect(fileHoldsProject(text, full("Acme 2"))).toBe(false);
    expect(fileHoldsProject(text, { ...full("Acme"), favorite: true })).toBe(false);
    expect(fileHoldsProject(text, { ...full("Acme"), tags: ["x"] })).toBe(false);
  });

  it("is false for unreadable files", () => {
    expect(fileHoldsProject("not json", full("Acme"))).toBe(false);
    expect(fileHoldsProject("", full("Acme"))).toBe(false);
  });
});
