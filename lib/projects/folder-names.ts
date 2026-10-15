import { slugify } from "@/lib/logo/pack";
import { projectToJson } from "@/lib/projects/transfer";
import { projectName, type BrandProject } from "@/lib/projects/types";

export const FOLDER_FILE_SUFFIX = ".designhub.json";

const MAX_SLUG = 40;

/** Project ids become part of a file name, so anything but letters, digits and hyphens is replaced. */
const safeId = (id: string): string => id.replace(/[^a-zA-Z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "project";

/**
 * The file a project is written to inside the chosen folder: `<slug>-<id>.designhub.json`. Always a single
 * path segment with no separators or dots beyond the suffix, so a write can never leave the folder.
 */
export function folderFileName(project: Pick<BrandProject, "id" | "snapshot">): string {
  const slug =
    slugify(projectName(project as BrandProject))
      .slice(0, MAX_SLUG)
      .replace(/-+$/, "") || "brand";
  return `${slug}-${safeId(project.id)}${FOLDER_FILE_SUFFIX}`;
}

/** True for a name this module could have produced for the project, whatever its name was at the time. */
export function isFileOfProject(fileName: string, projectId: string): boolean {
  return fileName.endsWith(`-${safeId(projectId)}${FOLDER_FILE_SUFFIX}`);
}

/** Guards every file name before it reaches the directory handle. */
export function isSafeFolderFileName(name: string): boolean {
  return /^[a-z0-9][a-z0-9-]*\.designhub\.json$/.test(name) && !name.includes("..");
}

/** Everything in an export except its timestamp, so an unchanged project compares equal. */
function withoutTimestamp(text: string): string | null {
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    delete parsed.exportedAt;
    return JSON.stringify(parsed);
  } catch {
    return null;
  }
}

/** True when a file already holds exactly this project, so rewriting it would only change `exportedAt`. */
export function fileHoldsProject(fileText: string, project: BrandProject): boolean {
  const existing = withoutTimestamp(fileText);
  return existing !== null && existing === withoutTimestamp(projectToJson(project));
}
