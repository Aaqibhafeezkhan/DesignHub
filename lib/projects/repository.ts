import { databaseAvailable, safeDb } from "@/lib/db";
import { upgradeStored } from "@/lib/projects/migrate";
import { normalizeTags } from "@/lib/projects/tags";
import type { BrandProject } from "@/lib/projects/types";

/** Session copy, used when IndexedDB is unavailable (private mode, blocked storage). */
const memory = new Map<string, BrandProject>();

/**
 * A project as stored, made current: one saved before tags existed loads with none, and a snapshot saved by
 * an older version is migrated in memory (the stored row is rewritten by the next save). No table changes.
 */
const withTags = (project: BrandProject): BrandProject =>
  upgradeStored({ ...project, tags: normalizeTags(project.tags) });

export async function listProjects(): Promise<BrandProject[]> {
  const stored = await safeDb((db) => db.projects.toArray(), null);
  if (stored) {
    const projects = stored.map(withTags);
    projects.forEach((project) => memory.set(project.id, project));
    return projects;
  }
  return [...memory.values()];
}

export async function getProject(id: string): Promise<BrandProject | undefined> {
  const project = (await safeDb((db) => db.projects.get(id), undefined)) ?? memory.get(id);
  return project && withTags(project);
}

const savedListeners = new Set<(id: string) => void>();

/** Calls `listener` with the project id after every save (autosave, rename, import...). Returns an unsubscribe. */
export function onProjectSaved(listener: (id: string) => void): () => void {
  savedListeners.add(listener);
  return () => void savedListeners.delete(listener);
}

export async function saveProject(project: BrandProject): Promise<void> {
  memory.set(project.id, project);
  await safeDb((db) => db.projects.put(project), undefined);
  for (const listener of savedListeners) listener(project.id);
}

export async function updateProject(id: string, patch: Partial<Omit<BrandProject, "id">>): Promise<void> {
  const current = await getProject(id);
  if (!current) return;
  await saveProject({ ...current, ...patch });
}

export async function deleteProject(id: string): Promise<void> {
  memory.delete(id);
  await safeDb((db) => db.projects.delete(id), undefined);
}

export function projectsPersist(): boolean {
  return databaseAvailable();
}

export function newProjectId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
