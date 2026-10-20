import { indexedDbStorage } from "@/lib/db";

/** Where the key lives: its own IndexedDB row, never in a studio store, a project, an export or a share link. */
export const AI_KEY_STORAGE_NAME = "designhub:brand-dna-key";

export type StoredAiKey = {
  key: string;
  /** The person has seen exactly which images and instructions are sent, and agreed. Reset when the key is removed. */
  reviewed: boolean;
};

/** A key as pasted: no spaces or line breaks inside, and long enough to be one. */
export function cleanAiKey(value: string): string | null {
  const key = value.trim();
  return key.length >= 20 && !/\s/.test(key) ? key : null;
}

export async function loadAiKey(): Promise<StoredAiKey | null> {
  const raw = await indexedDbStorage.getItem(AI_KEY_STORAGE_NAME);
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return null;
    const { key, reviewed } = value as Record<string, unknown>;
    return typeof key === "string" && key ? { key, reviewed: reviewed === true } : null;
  } catch {
    return null;
  }
}

export async function saveAiKey(value: StoredAiKey): Promise<void> {
  await indexedDbStorage.setItem(AI_KEY_STORAGE_NAME, JSON.stringify(value));
}

/** One click removes the key and the consent that went with it. */
export async function removeAiKey(): Promise<void> {
  await indexedDbStorage.removeItem(AI_KEY_STORAGE_NAME);
}
