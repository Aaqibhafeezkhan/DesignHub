import { describe, expect, it } from "vitest";

import { isSafeFolderFileName } from "@/lib/projects/folder-names";
import { defaultSnapshot } from "@/lib/projects/snapshot";
import { parseProjectsFile } from "@/lib/projects/transfer";
import type { BrandProject } from "@/lib/projects/types";
import { projectsZip, projectZipEntries } from "@/lib/projects/zip";

const project = (name: string, id: string): BrandProject => ({
  id,
  snapshot: defaultSnapshot(name),
  favorite: false,
  tags: ["client"],
  createdAt: 1,
  updatedAt: 1,
  lastOpenedAt: 1,
});

const projects = [
  project("Acme Studio", "3f2b6c1e-9a4d-4e7a-8c55-0d1f2a3b4c5d"),
  project("Northwind", "7a8b9c0d-1e2f-4a3b-8c4d-5e6f7a8b9c0d"),
  project("Acme Studio", "0a1b2c3d-4e5f-4a6b-8c7d-8e9f0a1b2c3d"),
];

describe("projectZipEntries", () => {
  it("writes one valid project file per project, each importable on its own", () => {
    const entries = projectZipEntries(projects);
    expect(entries).toHaveLength(projects.length);
    entries.forEach((entry, index) => {
      const parsed = parseProjectsFile(String(entry.data));
      expect(parsed).toHaveLength(1);
      expect(parsed[0]!.snapshot.brand.profile.name).toBe(projects[index]!.snapshot.brand.profile.name);
      expect(parsed[0]!.tags).toEqual(["client"]);
    });
  });

  it("uses the folder autosave's names, so an unpacked ZIP matches the folder", () => {
    const names = projectZipEntries(projects).map((entry) => entry.name);
    expect(names[0]).toBe("acme-studio-3f2b6c1e-9a4d-4e7a-8c55-0d1f2a3b4c5d.designhub.json");
    for (const name of names) expect(isSafeFolderFileName(name), name).toBe(true);
  });

  it("keeps names unique, even for ids that clean up to the same text or differ only by case", () => {
    const clashing = [project("Acme", "a b"), project("Acme", "a/b"), project("Acme", "A-B"), project("Acme", "a-b")];
    const names = projectZipEntries(clashing).map((entry) => entry.name);
    expect(new Set(names.map((name) => name.toLowerCase())).size).toBe(clashing.length);
    expect(names[1]).toBe("acme-a-b-2.designhub.json");
  });

  it("includes version history when given", () => {
    const histories = new Map([
      [
        projects[0]!.id,
        [
          {
            id: "v1",
            projectId: projects[0]!.id,
            createdAt: 5,
            reason: "autosave" as const,
            snapshot: defaultSnapshot("Old"),
          },
        ],
      ],
    ]);
    const [first, second] = projectZipEntries(projects, histories);
    expect(parseProjectsFile(String(first!.data))[0]!.history).toHaveLength(1);
    expect(parseProjectsFile(String(second!.data))[0]!.history).toHaveLength(0);
  });
});

describe("projectsZip", () => {
  it("builds a ZIP with the files in it", () => {
    const bytes = projectsZip(projects);
    expect(String.fromCharCode(...bytes.slice(0, 2))).toBe("PK");
    const text = new TextDecoder().decode(bytes);
    for (const entry of projectZipEntries(projects)) expect(text).toContain(entry.name);
  });

  it("refuses an empty list", () => {
    expect(() => projectsZip([])).toThrow();
  });
});
