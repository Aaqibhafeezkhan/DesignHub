import { describe, expect, test } from "vitest";

import { MAX_PROJECT_NAME, versionProjectName } from "@/lib/projects/names";

describe("versionProjectName", () => {
  test("names the project after the version's date", () => {
    expect(versionProjectName("Acme", "version 3 May", new Set())).toBe("Acme (version 3 May)");
  });

  test("stays unique", () => {
    const taken = new Set(["Acme (version 3 May)", "Acme (version 3 May) 2"]);
    expect(versionProjectName("Acme", "version 3 May", taken)).toBe("Acme (version 3 May) 3");
  });

  test("shortens a long base name, never the label", () => {
    const name = versionProjectName("A".repeat(80), "version 3 May", new Set());
    expect(name.length).toBeLessThanOrEqual(MAX_PROJECT_NAME);
    expect(name.endsWith("… (version 3 May)")).toBe(true);
  });

  test("a long name stays unique within the limit", () => {
    const first = versionProjectName("A".repeat(80), "version 3 May", new Set());
    const second = versionProjectName("A".repeat(80), "version 3 May", new Set([first]));
    expect(second).not.toBe(first);
    expect(second.length).toBeLessThanOrEqual(MAX_PROJECT_NAME);
  });
});
