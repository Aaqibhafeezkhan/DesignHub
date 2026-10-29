import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import { MAX_VERSIONS, type ProjectVersion } from "@/lib/projects/history";
import { upgradeStored } from "@/lib/projects/migrate";
import { defaultSnapshot, type BrandSnapshot } from "@/lib/projects/snapshot";
import { compactVersions, expandVersions, storedBytes } from "@/lib/projects/version-storage";

/** Twenty versions of one brand, each a small edit of the one before: a name, a color, a font. */
function history(count = MAX_VERSIONS): ProjectVersion[] {
  const versions: ProjectVersion[] = [];
  let snapshot = structuredClone(defaultSnapshot("Acme"));
  for (let index = 0; index < count; index += 1) {
    snapshot = structuredClone(snapshot);
    if (index % 3 === 0) snapshot.brand.profile.description = `Version ${index} of the description`;
    if (index % 3 === 1 && snapshot.colors.swatches[0])
      snapshot.colors.swatches[0].color = { ...snapshot.colors.swatches[0].color, h: index * 10 };
    if (index % 3 === 2) snapshot.typography.headingFont = index % 2 ? "Inter" : "Lora";
    versions.push({ id: `v${index}`, projectId: "p1", createdAt: 1000 + index, reason: "autosave", snapshot });
  }
  return versions;
}

describe("version storage", () => {
  test("every version is rebuilt exactly from the compact rows", () => {
    const versions = history();
    const rows = compactVersions(versions);
    const rebuilt = expandVersions(rows);
    expect(rebuilt).toHaveLength(versions.length);
    for (const original of versions) expect(rebuilt.find((item) => item.id === original.id)).toEqual(original);
  });

  test("only the newest version is whole, and the rest are changes from the next newer", () => {
    const rows = compactVersions(history());
    const whole = rows.filter((row) => "snapshot" in row);
    expect(whole).toHaveLength(1);
    expect(whole[0]?.id).toBe(`v${MAX_VERSIONS - 1}`);
    const second = rows.find((row) => row.id === `v${MAX_VERSIONS - 2}`);
    expect(second && "baseId" in second ? second.baseId : null).toBe(`v${MAX_VERSIONS - 1}`);
  });

  test("twenty versions take well under half the bytes of twenty whole snapshots", () => {
    const versions = history();
    const whole = storedBytes(versions);
    const compact = storedBytes(compactVersions(versions));
    expect(compact).toBeLessThan(whole / 2);
  });

  test("rows written before this, whole snapshots, still read and mix with changes", () => {
    const versions = history(6);
    const rows = compactVersions(versions);
    // The oldest two are whole rows, as an older version of the app wrote them.
    const mixed = rows.map((row) => {
      const original = versions.find((item) => item.id === row.id)!;
      return row.id === "v0" || row.id === "v1" ? original : row;
    });
    const rebuilt = expandVersions(mixed);
    for (const original of versions) expect(rebuilt.find((item) => item.id === original.id)).toEqual(original);
  });

  test("a row whose base is missing is left out, not guessed", () => {
    const rows = compactVersions(history(4)).filter((row) => row.id !== "v3");
    expect(expandVersions(rows).map((item) => item.id)).toEqual([]);
  });

  test("a version's order does not depend on the order of the rows", () => {
    const rows = compactVersions(history(8));
    const reversed = [...rows].reverse();
    expect(expandVersions(reversed).map((item) => item.id)).toEqual(expandVersions(rows).map((item) => item.id));
  });

  test("an older schema is upgraded before a change is applied", () => {
    const fixture = JSON.parse(
      readFileSync(join(__dirname, "__fixtures__/v1/project-with-history.designhub.json"), "utf8"),
    ) as { history: { createdAt: number; reason: ProjectVersion["reason"]; snapshot: BrandSnapshot }[] };
    const versions = fixture.history.map((entry, index) => ({
      id: `h${index}`,
      projectId: "p1",
      createdAt: entry.createdAt,
      reason: entry.reason,
      snapshot: upgradeStored({ snapshot: entry.snapshot }).snapshot,
    }));
    const rebuilt = expandVersions(compactVersions(versions), upgradeStored);
    for (const original of versions) expect(rebuilt.find((item) => item.id === original.id)).toEqual(original);
  });
});
