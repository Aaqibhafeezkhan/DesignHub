import { FOLDER_FILE_SUFFIX, folderFileName } from "@/lib/projects/folder-names";
import { projectToJson, type ProjectHistories } from "@/lib/projects/transfer";
import type { BrandProject } from "@/lib/projects/types";
import { createZip, type ZipEntry } from "@/lib/zip";

/**
 * One `.designhub.json` per project, named like the folder autosave names them, so a ZIP unpacked into
 * the autosave folder matches it. Names are compared without case, since a folder on macOS or Windows
 * would merge two that differ only by case, and a clash gets a counter before the suffix.
 */
export function projectZipEntries(projects: BrandProject[], histories?: ProjectHistories): ZipEntry[] {
  const used = new Set<string>();
  return projects.map((project) => {
    const base = folderFileName(project).slice(0, -FOLDER_FILE_SUFFIX.length);
    let name = `${base}${FOLDER_FILE_SUFFIX}`;
    for (let count = 2; used.has(name.toLowerCase()); count += 1) name = `${base}-${count}${FOLDER_FILE_SUFFIX}`;
    used.add(name.toLowerCase());
    return { name, data: projectToJson(project, histories?.get(project.id)) };
  });
}

/** The ZIP bytes for a list of projects. Throws on an empty list, which has nothing to export. */
export function projectsZip(projects: BrandProject[], histories?: ProjectHistories): Uint8Array<ArrayBuffer> {
  if (!projects.length) throw new Error("There are no projects to export.");
  return createZip(projectZipEntries(projects, histories));
}
