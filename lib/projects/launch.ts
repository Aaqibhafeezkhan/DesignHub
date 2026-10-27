import { parseProjectsFile, type ProjectEntry } from "@/lib/projects/transfer";

/** The largest file the app will read, so a wrong double click can't freeze the tab. */
export const MAX_LAUNCH_BYTES = 25 * 1024 * 1024;

/** The cache and key the service worker puts a file shared from another app into. */
const SHARE_CACHE = "designhub-share";
export const SHARE_KEY = "/shared-project";
export const SHARE_PARAM = "shared";

/** The part of a `File` the import reads. */
export type LaunchFile = { name: string; size: number; text: () => Promise<string> };

/** The part of a `FileSystemFileHandle` the launch queue provides. */
export type LaunchHandle = { name?: string; getFile: () => Promise<LaunchFile> };

export type LaunchParams = { files: readonly LaunchHandle[] };

/** `window.launchQueue`, where the browser supports file handlers. */
export type LaunchQueue = { setConsumer: (consumer: (params: LaunchParams) => void) => void };

/** A file checked and ready to confirm: its text is validated and sanitized again on import. */
export type LaunchResult =
  | { ok: true; name: string; text: string; entries: ProjectEntry[] }
  | { ok: false; name: string; reason: "unsupported" | "tooLarge" | "invalid"; error?: unknown };

/**
 * Checks one opened file the way a normal import would: it must be a `.json` file within the size
 * limit and parse as a DesignHub project (which validates it and sanitizes its logos). Nothing is
 * stored; the caller asks before importing.
 */
export async function readProjectFile(file: LaunchFile): Promise<LaunchResult> {
  const name = file.name;
  if (!name.toLowerCase().endsWith(".json")) return { ok: false, name, reason: "unsupported" };
  if (file.size > MAX_LAUNCH_BYTES) return { ok: false, name, reason: "tooLarge" };
  try {
    const text = await file.text();
    return { ok: true, name, text, entries: parseProjectsFile(text) };
  } catch (error) {
    return { ok: false, name, reason: "invalid", error };
  }
}

/** Checks every file of a launch. A file that can't be read at all is reported, not thrown. */
export async function readLaunchFiles(handles: readonly LaunchHandle[]): Promise<LaunchResult[]> {
  const results: LaunchResult[] = [];
  for (const handle of handles) {
    try {
      results.push(await readProjectFile(await handle.getFile()));
    } catch (error) {
      results.push({ ok: false, name: handle.name ?? "", reason: "invalid", error });
    }
  }
  return results;
}

/** The launch queue of a window, or null in browsers without file handlers (Firefox, Safari). */
export function launchQueueOf(target: object): LaunchQueue | null {
  const queue = (target as { launchQueue?: unknown }).launchQueue;
  if (typeof queue !== "object" || queue === null) return null;
  return typeof (queue as { setConsumer?: unknown }).setConsumer === "function" ? (queue as LaunchQueue) : null;
}

/**
 * Hands every file launch (a double click on a `.designhub.json` file) to `onFiles`. Returns false
 * without doing anything where the browser has no launch queue, so those browsers see no change.
 * Launches without files (opening the app normally) are ignored.
 */
export function consumeLaunchQueue(target: object, onFiles: (handles: readonly LaunchHandle[]) => void): boolean {
  const queue = launchQueueOf(target);
  if (!queue) return false;
  queue.setConsumer((params) => {
    if (params.files.length > 0) onFiles(params.files);
  });
  return true;
}

/** The text to show for the projects in a launch: how many, and the first one's name. */
export function launchSummary(results: LaunchResult[]): { count: number; first: string } {
  const entries = results.flatMap((result) => (result.ok ? result.entries : []));
  return { count: entries.length, first: entries[0]?.snapshot.brand.profile.name.trim() ?? "" };
}

/**
 * Takes the file the service worker saved when another app shared one to DesignHub (the worker
 * answers that POST itself, so the file never leaves the device). The entry is removed as it is
 * read, so a reload doesn't ask again. Returns null when nothing is waiting.
 */
export async function takeSharedFile(storage: Pick<CacheStorage, "open">): Promise<LaunchFile | null> {
  const cache = await storage.open(SHARE_CACHE);
  const response = await cache.match(SHARE_KEY);
  if (!response) return null;
  const blob = await response.blob();
  await cache.delete(SHARE_KEY);
  return {
    name: response.headers.get("x-file-name") || "shared.designhub.json",
    size: blob.size,
    text: () => blob.text(),
  };
}
