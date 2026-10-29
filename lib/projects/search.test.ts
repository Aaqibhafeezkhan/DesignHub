import { describe, expect, test } from "vitest";

import { matchesProject, PROJECT_PAGE } from "@/lib/projects/search";
import { defaultSnapshot } from "@/lib/projects/snapshot";
import type { BrandProject } from "@/lib/projects/types";

const project = (name: string, tags: string[] = []): BrandProject => ({
  id: name,
  favorite: false,
  tags,
  createdAt: 0,
  updatedAt: 0,
  lastOpenedAt: 0,
  snapshot: defaultSnapshot(name),
});

describe("matchesProject", () => {
  test("matches a word of the name, in any case", () => {
    expect(matchesProject(project("Acme Labs"), "acme")).toBe(true);
    expect(matchesProject(project("Acme Labs"), "LABS")).toBe(true);
    expect(matchesProject(project("Acme Labs"), "zeta")).toBe(false);
  });

  test("matches a tag, and a name and a tag together", () => {
    const acme = project("Acme Labs", ["client", "archived"]);
    expect(matchesProject(acme, "client")).toBe(true);
    expect(matchesProject(acme, "acme archived")).toBe(true);
    expect(matchesProject(acme, "acme draft")).toBe(false);
  });

  test("an empty search matches everything", () => {
    expect(matchesProject(project("Acme"), "   ")).toBe(true);
  });

  test("the first page is a screenful, not the whole list", () => {
    expect(PROJECT_PAGE).toBeGreaterThan(0);
    expect(PROJECT_PAGE).toBeLessThanOrEqual(36);
  });
});
