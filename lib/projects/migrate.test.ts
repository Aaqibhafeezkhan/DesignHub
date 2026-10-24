import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import { effectDefaults } from "@/lib/effects/defaults";
import { LocalizedError } from "@/lib/i18n/errors";
import {
  assertKnownVersion,
  migrateSnapshot,
  readSchemaVersion,
  SCHEMA_VERSION,
  upgradeStored,
} from "@/lib/projects/migrate";
import { readShareToken, shareToken } from "@/lib/projects/share";
import { defaultSnapshot } from "@/lib/projects/snapshot";
import { parseProjectsFile, projectsToJson, projectToJson } from "@/lib/projects/transfer";
import type { BrandProject } from "@/lib/projects/types";
import { tokensFromSnapshot } from "@/lib/tokens/from-snapshot";
import { tokenFormats } from "@/lib/tokens/formats";
import { loadFontCatalog } from "@/lib/typography/catalog";

/**
 * Files exported by DesignHub 1.0.0: a project, a project with version history, a list of projects and a
 * share link. They are committed as they were written, and every one must open in the current version.
 */
const FIXTURES = join(__dirname, "__fixtures__", "v1");
const fixture = (name: string) => readFileSync(join(FIXTURES, name), "utf8");

type Raw = Record<string, unknown>;
const json = (name: string) => JSON.parse(fixture(name)) as Raw;

describe("the 1.0.0 fixtures", () => {
  test("really are version 1, without what was added since", () => {
    for (const name of ["project.designhub.json", "project-with-history.designhub.json", "projects.json"]) {
      expect(json(name).version, name).toBe(1);
    }
    const snapshot = json("project.designhub.json").snapshot as {
      version: number;
      effects: { settings: Raw };
      social: Raw;
    };
    expect(snapshot.version).toBe(1);
    for (const kind of ["duotone", "scrim", "card-tilt"]) expect(snapshot.effects.settings[kind], kind).toBeUndefined();
    expect(snapshot.social).not.toHaveProperty("packSelection");
  });

  test("a project file opens as a version 2 snapshot, keeping its name, tags and favorite", () => {
    const [entry, ...rest] = parseProjectsFile(fixture("project.designhub.json"));
    expect(rest).toEqual([]);
    expect(entry!.snapshot.version).toBe(2);
    expect(entry!.snapshot.brand.profile).toMatchObject({
      name: "Fixture Brand",
      description: "A brand exported by DesignHub 1.0.0.",
    });
    expect(entry!.tags).toEqual(["client", "demo"]);
    expect(entry!.favorite).toBe(true);
  });

  test("the effects added after 1.0.0 get their defaults, and the saved ones are kept", () => {
    const [entry] = parseProjectsFile(fixture("project.designhub.json"));
    const settings = entry!.snapshot.effects.settings;
    expect(settings.duotone).toEqual(effectDefaults.duotone);
    expect(settings.scrim).toEqual(effectDefaults.scrim);
    expect(settings["card-tilt"]).toEqual(effectDefaults["card-tilt"]);
    expect(settings.glass).toEqual(
      (json("project.designhub.json").snapshot as { effects: { settings: Raw } }).effects.settings.glass,
    );
  });

  test("the social ZIP selection is part of the snapshot and starts as the default", () => {
    const [entry] = parseProjectsFile(fixture("project.designhub.json"));
    expect(entry!.snapshot.social.packSelection).toBeNull();
  });

  test("a project with history migrates every version it carries", () => {
    const [entry] = parseProjectsFile(fixture("project-with-history.designhub.json"));
    expect(entry!.history.map((version) => version.snapshot.brand.profile.name)).toEqual([
      "Fixture Brand (older)",
      "Fixture Brand (oldest)",
    ]);
    for (const version of entry!.history) {
      expect(version.snapshot.version).toBe(2);
      expect(version.snapshot.effects.settings.scrim).toEqual(effectDefaults.scrim);
    }
  });

  test("a list of projects migrates each project and its history", () => {
    const entries = parseProjectsFile(fixture("projects.json"));
    expect(entries.map((entry) => entry.snapshot.brand.profile.name)).toEqual(["Fixture Brand", "Second Fixture"]);
    expect(entries.every((entry) => entry.snapshot.version === 2)).toBe(true);
    expect(entries[0]!.history).toHaveLength(2);
    expect(entries[1]!.history).toHaveLength(0);
  });

  test("a share link from 1.0.0 still opens", async () => {
    const url = fixture("share-link.txt").trim();
    const token = shareToken(new URL(url).hash);
    expect(token).not.toBeNull();
    const shared = await readShareToken(token!);
    expect(shared.snapshot.version).toBe(2);
    expect(shared.snapshot.brand.profile.name).toBe("Fixture Brand");
    expect(shared.snapshot.effects.settings.scrim).toEqual(effectDefaults.scrim);
  });

  test("the command line builds the same formats from a version 1 and a version 2 file", async () => {
    const catalog = await loadFontCatalog();
    const [entry] = parseProjectsFile(fixture("project.designhub.json"));
    const project: BrandProject = {
      id: "p",
      favorite: entry!.favorite,
      tags: entry!.tags,
      createdAt: 1,
      updatedAt: 1,
      lastOpenedAt: 1,
      snapshot: entry!.snapshot,
    };
    // The same project written by this version is a version 2 file; reading it back changes nothing.
    const [again] = parseProjectsFile(projectToJson(project));
    const build = (snapshot: typeof project.snapshot) =>
      tokenFormats(tokensFromSnapshot(snapshot, catalog, new Date(0).toISOString())).map((format) => [
        format.id,
        format.code,
      ]);
    expect(build(again!.snapshot)).toEqual(build(entry!.snapshot));
  });
});

describe("version 2 files", () => {
  const project: BrandProject = {
    id: "p1",
    favorite: false,
    tags: [],
    createdAt: 1,
    updatedAt: 1,
    lastOpenedAt: 1,
    snapshot: defaultSnapshot("Acme"),
  };

  test("are written as version 2, in the file and in the snapshot", () => {
    expect(SCHEMA_VERSION).toBe(2);
    for (const text of [projectToJson(project), projectsToJson([project])]) {
      const data = JSON.parse(text) as Raw;
      expect(data.version).toBe(2);
    }
    const written = JSON.parse(projectToJson(project)) as { snapshot: { version: number } };
    expect(written.snapshot.version).toBe(2);
  });

  test("round trip unchanged, ZIP selection included", () => {
    const chosen = structuredClone(project);
    chosen.snapshot.social.packSelection = ["kick-banner", "github-minimal"];
    const [entry] = parseProjectsFile(projectToJson(chosen));
    expect(entry!.snapshot.social.packSelection).toEqual(["kick-banner", "github-minimal"]);
    expect(entry!.snapshot).toEqual(chosen.snapshot);
  });

  test("a hand-edited ZIP selection keeps only ids that look like template ids", () => {
    const edited = JSON.parse(projectToJson(project)) as { snapshot: { social: Raw } };
    edited.snapshot.social.packSelection = ["kick-banner", "<script>", 7, "../x", "a".repeat(200), "ok-1"];
    const [entry] = parseProjectsFile(JSON.stringify(edited));
    expect(entry!.snapshot.social.packSelection).toEqual(["kick-banner", "ok-1"]);
    edited.snapshot.social.packSelection = "everything";
    expect(parseProjectsFile(JSON.stringify(edited))[0]!.snapshot.social.packSelection).toBeNull();
  });
});

describe("a version newer than this one", () => {
  const future = (patch: Raw) => JSON.stringify({ ...json("project.designhub.json"), ...patch });

  test("is refused with a message that says to update, and names the version", () => {
    for (const text of [future({ version: 3 }), future({ version: 99 })]) {
      expect(() => parseProjectsFile(text)).toThrow(LocalizedError);
      try {
        parseProjectsFile(text);
      } catch (error) {
        expect((error as LocalizedError).key).toBe("error.file.newer");
        expect((error as LocalizedError).message).toMatch(/newer version of DesignHub/);
      }
    }
    expect(() => parseProjectsFile(JSON.stringify({ ...json("projects.json"), version: 3 }))).toThrow(/newer version/);
  });

  test("is refused when only its snapshot is newer", () => {
    const data = json("project.designhub.json") as { snapshot: Raw };
    expect(() => parseProjectsFile(JSON.stringify({ ...data, snapshot: { ...data.snapshot, version: 3 } }))).toThrow(
      /newer version/,
    );
  });

  test("a version that is not a whole number is not a project", () => {
    for (const version of [0, -1, 1.5, "1", null, [], {}]) {
      expect(() => parseProjectsFile(future({ version })), JSON.stringify(version)).toThrow(
        /isn't a DesignHub project/,
      );
    }
  });

  test("a file with no version is read as the first one", () => {
    const data = json("project.designhub.json");
    delete data.version;
    const [entry] = parseProjectsFile(JSON.stringify(data));
    expect(entry!.snapshot.version).toBe(2);
  });
});

describe("migrating a snapshot", () => {
  test("a current snapshot is returned as it is, and a value that is not an object is left alone", () => {
    const current = defaultSnapshot("Acme");
    expect(migrateSnapshot(current)).toBe(current);
    expect(migrateSnapshot(null)).toBeNull();
    expect(migrateSnapshot("x")).toBe("x");
  });

  test("a version 1 snapshot is not changed in place", () => {
    const old = { ...defaultSnapshot("Acme"), version: 1 } as unknown as Raw;
    const before = JSON.stringify(old);
    const next = migrateSnapshot(old) as { version: number };
    expect(next.version).toBe(2);
    expect(JSON.stringify(old)).toBe(before);
  });

  test("version checks", () => {
    expect(readSchemaVersion(undefined)).toBe(1);
    expect(readSchemaVersion(2)).toBe(2);
    expect(() => assertKnownVersion(2)).not.toThrow();
    expect(() => assertKnownVersion(3)).toThrow();
  });

  test("a stored project is upgraded, one from a newer version is left as it is, and a current one is not copied", () => {
    const old = { id: "a", snapshot: { ...defaultSnapshot("Acme"), version: 1 } };
    expect(upgradeStored(old).snapshot).toMatchObject({ version: 2 });
    const future = { id: "b", snapshot: { ...defaultSnapshot("Acme"), version: 7 } };
    expect(upgradeStored(future)).toBe(future);
    const current = { id: "c", snapshot: defaultSnapshot("Acme") };
    expect(upgradeStored(current)).toBe(current);
  });
});
