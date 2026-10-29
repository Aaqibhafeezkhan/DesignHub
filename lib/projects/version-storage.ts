import { applyDelta, diffJson, type Delta, type Json } from "@/lib/projects/delta";
import { sortVersions, type ProjectVersion } from "@/lib/projects/history";
import type { BrandSnapshot } from "@/lib/projects/snapshot";

/**
 * A version as it is stored. The newest is whole (`snapshot`). An older one is the change that takes the next
 * newer version back to it (`delta`, with that version's id as `baseId`), so a long history costs about the
 * size of its edits, not twenty copies of the brand. A row written before this has a `snapshot` and stays valid.
 */
export type StoredVersion = Omit<ProjectVersion, "snapshot"> &
  ({ snapshot: BrandSnapshot } | { delta: Delta | null; baseId: string });

const asJson = (snapshot: BrandSnapshot): Json => snapshot as unknown as Json;

/** Rows for versions: the newest whole, each other one as the change from the version after it. */
export function compactVersions(versions: ProjectVersion[]): StoredVersion[] {
  const ordered = sortVersions(versions);
  return ordered.map((version, index) => {
    const newer = ordered[index - 1];
    if (!newer) return version;
    const { snapshot, ...rest } = version;
    return { ...rest, delta: diffJson(asJson(newer.snapshot), asJson(snapshot)), baseId: newer.id };
  });
}

/**
 * The versions the rows hold, newest first, each whole again. `upgrade` brings an old snapshot up to date before
 * a change is applied to it or from it. A row whose base is missing cannot be rebuilt and is left out.
 */
export function expandVersions(
  rows: StoredVersion[],
  upgrade: <T extends { snapshot: unknown }>(item: T) => T = (item) => item,
): ProjectVersion[] {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const built = new Map<string, ProjectVersion | null>();

  function build(id: string, seen: Set<string>): ProjectVersion | null {
    if (built.has(id)) return built.get(id) ?? null;
    const row = byId.get(id);
    if (!row || seen.has(id)) return null;
    let version: ProjectVersion | null;
    if ("snapshot" in row) version = upgrade(row);
    else {
      const base = build(row.baseId, new Set(seen).add(id));
      version = base
        ? upgrade({
            id: row.id,
            projectId: row.projectId,
            createdAt: row.createdAt,
            reason: row.reason,
            snapshot: applyDelta(asJson(base.snapshot), row.delta) as unknown as BrandSnapshot,
          })
        : null;
    }
    built.set(id, version);
    return version;
  }

  return sortVersions(rows.flatMap((row) => build(row.id, new Set()) ?? []));
}

/** The bytes a list of rows takes as JSON, for comparing the two forms. */
export const storedBytes = (rows: unknown[]): number => new TextEncoder().encode(JSON.stringify(rows)).length;
