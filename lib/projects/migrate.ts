import { effectDefaults } from "@/lib/effects/defaults";
import { LocalizedError } from "@/lib/i18n/errors";

/**
 * The version of the project file, the share link's JSON and the snapshots saved in IndexedDB. A change to
 * the shape of a snapshot adds a step to `migrations` and raises this number, so nothing ever saved stops
 * opening. See docs/migrating-to-v2.md.
 */
export const SCHEMA_VERSION = 2;

type Data = Record<string, unknown>;

const isObject = (value: unknown): value is Data =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * The version a file or snapshot says it has: a whole number from 1, or 1 when it says nothing (the first
 * files had no reason to). Anything else is not a DesignHub project.
 */
export function readSchemaVersion(value: unknown): number {
  if (value === undefined) return 1;
  if (typeof value === "number" && Number.isInteger(value) && value >= 1) return value;
  throw new LocalizedError("error.file.notProject");
}

/** Refuses what a newer DesignHub wrote, with a message that says to update, instead of reading it half. */
export function assertKnownVersion(version: number): void {
  if (version > SCHEMA_VERSION) throw new LocalizedError("error.file.newer", { version });
}

/**
 * Version 2 changes two things in a snapshot. The social studio's ZIP selection is part of the brand now
 * (a v1 project had none, so it starts with the default of the core platforms), and the Effects Lab settings
 * carry every effect, so an effect added after the project was saved (duotone, scrim, card tilt) has its
 * defaults instead of being missing.
 */
function v1ToV2(snapshot: Data): Data {
  const social = isObject(snapshot.social) ? snapshot.social : {};
  const effects = isObject(snapshot.effects) ? snapshot.effects : {};
  const saved = isObject(effects.settings) ? effects.settings : {};
  const settings: Data = { ...effectDefaults };
  for (const [kind, value] of Object.entries(saved)) {
    const defaults = (effectDefaults as unknown as Record<string, unknown>)[kind];
    settings[kind] = isObject(value) && isObject(defaults) ? { ...defaults, ...value } : value;
  }
  return {
    ...snapshot,
    version: 2,
    social: { ...social, packSelection: social.packSelection ?? null },
    effects: { ...effects, settings },
  };
}

/** Migrations by the version they upgrade from. Each is pure and returns a copy at the next version. */
const migrations: Record<number, (snapshot: Data) => Data> = { 1: v1ToV2 };

/**
 * Brings a snapshot of any known version up to the current one. A value that is not an object is returned
 * as it is, for the caller's own checks to reject. A snapshot from a newer version throws, and one that is
 * current is returned as it is, with no copy.
 */
export function migrateSnapshot(snapshot: unknown): unknown {
  if (!isObject(snapshot)) return snapshot;
  let version = readSchemaVersion(snapshot.version);
  assertKnownVersion(version);
  let current = snapshot;
  while (version < SCHEMA_VERSION) {
    const step = migrations[version];
    if (!step) throw new LocalizedError("error.file.notProject");
    current = step(current);
    version += 1;
  }
  return current;
}

/**
 * A stored snapshot, upgraded when it is old. One saved by a newer version (the app was rolled back) is
 * left as it is: it cannot be read here, but it is not damaged, and the newer app still can.
 */
export function upgradeStored<T extends { snapshot: unknown }>(item: T): T {
  try {
    const snapshot = migrateSnapshot(item.snapshot);
    return snapshot === item.snapshot ? item : { ...item, snapshot };
  } catch {
    return item;
  }
}
