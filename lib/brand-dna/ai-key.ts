import { indexedDbStorage } from "@/lib/db";

/** Where the key lives: its own IndexedDB row, never in a studio store, a project, an export or a share link. */
export const AI_KEY_STORAGE_NAME = "designhub:brand-dna-key";

/** The second provider's record: a base URL, a model and a key, kept apart from the first provider's. */
export const OPENAI_KEY_STORAGE_NAME = "designhub:brand-dna-openai-key";

export type StoredAiKey = {
  key: string;
  /** The person has seen exactly which images and instructions are sent, and agreed. Reset when the key is removed. */
  reviewed: boolean;
  /** The model to ask. The first provider falls back to its default without one. */
  model?: string;
  /** The endpoint of an OpenAI-compatible provider, without a trailing slash. */
  baseUrl?: string;
};

/** A key as pasted: no spaces or line breaks inside, and long enough to be one. */
export function cleanAiKey(value: string): string | null {
  const key = value.trim();
  return key.length >= 20 && !/\s/.test(key) ? key : null;
}

/** A model name as pasted: letters, digits and the few separators model names use. */
export function cleanModelName(value: string): string | null {
  const model = value.trim();
  return /^[A-Za-z0-9][\w.:/@-]{0,99}$/.test(model) ? model : null;
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** True for an address on this device, where a plain `http` endpoint and no key are fine. */
export function isLocalHost(hostname: string): boolean {
  return LOCAL_HOSTS.has(hostname.toLowerCase());
}

/**
 * An endpoint as pasted: `https` anywhere, or `http` only on this device (a local model server). No
 * credentials, query or fragment, and no trailing slash. Returns null for anything else.
 */
export function cleanBaseUrl(value: string): string | null {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  const secure = url.protocol === "https:";
  if (!secure && !(url.protocol === "http:" && isLocalHost(url.hostname))) return null;
  if (url.username || url.password || url.search || url.hash) return null;
  return `${url.origin}${url.pathname}`.replace(/\/+$/, "");
}

/** Whether a base URL points at this device, so a key is optional. */
export function isLocalBaseUrl(baseUrl: string | undefined): boolean {
  if (!baseUrl) return false;
  try {
    return isLocalHost(new URL(baseUrl).hostname);
  } catch {
    return false;
  }
}

export async function loadAiKey(name: string = AI_KEY_STORAGE_NAME): Promise<StoredAiKey | null> {
  const raw = await indexedDbStorage.getItem(name);
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return null;
    const { key, reviewed, model, baseUrl } = value as Record<string, unknown>;
    if (typeof key !== "string") return null;
    const base = typeof baseUrl === "string" && cleanBaseUrl(baseUrl) ? baseUrl : undefined;
    // A key is required, except for a server on this device.
    if (!key && !isLocalBaseUrl(base)) return null;
    return {
      key,
      reviewed: reviewed === true,
      ...(typeof model === "string" && cleanModelName(model) ? { model } : {}),
      ...(base ? { baseUrl: base } : {}),
    };
  } catch {
    return null;
  }
}

export async function saveAiKey(value: StoredAiKey, name: string = AI_KEY_STORAGE_NAME): Promise<void> {
  await indexedDbStorage.setItem(name, JSON.stringify(value));
}

/** One click removes the key and the consent that went with it. */
export async function removeAiKey(name: string = AI_KEY_STORAGE_NAME): Promise<void> {
  await indexedDbStorage.removeItem(name);
}
