import { describe, expect, test, vi } from "vitest";

import {
  consumeLaunchQueue,
  launchQueueOf,
  launchSummary,
  MAX_LAUNCH_BYTES,
  readLaunchFiles,
  readProjectFile,
  SHARE_KEY,
  takeSharedFile,
  type LaunchFile,
  type LaunchHandle,
  type LaunchParams,
} from "@/lib/projects/launch";
import { defaultSnapshot } from "@/lib/projects/snapshot";
import { projectToJson, projectsToJson } from "@/lib/projects/transfer";
import type { BrandProject } from "@/lib/projects/types";

const project = (name: string): BrandProject => ({
  id: name,
  favorite: false,
  tags: [],
  createdAt: 1,
  updatedAt: 1,
  lastOpenedAt: 1,
  snapshot: defaultSnapshot(name),
});

const file = (name: string, text: string, size = text.length): LaunchFile => ({ name, size, text: async () => text });
const handle = (launched: LaunchFile): LaunchHandle => ({ name: launched.name, getFile: async () => launched });

describe("readProjectFile", () => {
  test("accepts a project file and returns its validated entries", async () => {
    const result = await readProjectFile(file("acme.designhub.json", projectToJson(project("Acme"))));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.entries.map((entry) => entry.snapshot.brand.profile.name)).toEqual(["Acme"]);
  });

  test("accepts a file with several projects", async () => {
    const result = await readProjectFile(file("all.json", projectsToJson([project("One"), project("Two")])));
    expect(launchSummary([result])).toEqual({ count: 2, first: "One" });
  });

  test("rejects other file types, oversized files and invalid content, changing nothing", async () => {
    expect(await readProjectFile(file("photo.png", "x"))).toMatchObject({ ok: false, reason: "unsupported" });
    expect(await readProjectFile(file("big.designhub.json", "{}", MAX_LAUNCH_BYTES + 1))).toMatchObject({
      ok: false,
      reason: "tooLarge",
    });
    expect(await readProjectFile(file("bad.json", "{ nope"))).toMatchObject({ ok: false, reason: "invalid" });
    expect(await readProjectFile(file("other.json", JSON.stringify({ hello: "world" })))).toMatchObject({
      ok: false,
      reason: "invalid",
    });
  });

  test("sanitizes an unsafe logo exactly like a normal import", async () => {
    const unsafe = project("Evil");
    unsafe.snapshot.brand.profile.logoSvg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" onload="alert(1)"><script>alert(2)</script><rect width="10" height="10"/></svg>';
    const result = await readProjectFile(file("evil.designhub.json", projectToJson(unsafe)));
    expect(result.ok).toBe(true);
    if (result.ok) {
      const logo = result.entries[0]!.snapshot.brand.profile.logoSvg ?? "";
      expect(logo).not.toContain("script");
      expect(logo).not.toContain("onload");
    }
  });
});

describe("readLaunchFiles", () => {
  test("checks every file and reports one that can't be read instead of throwing", async () => {
    const unreadable: LaunchHandle = {
      name: "gone.designhub.json",
      getFile: async () => {
        throw new Error("NotFoundError");
      },
    };
    const results = await readLaunchFiles([
      handle(file("a.designhub.json", projectToJson(project("A")))),
      unreadable,
      handle(file("b.txt", "x")),
    ]);
    expect(results.map((result) => (result.ok ? "ok" : result.reason))).toEqual(["ok", "invalid", "unsupported"]);
    expect(results[1]).toMatchObject({ name: "gone.designhub.json" });
  });
});

describe("launch queue", () => {
  test("browsers without a launch queue are left alone", () => {
    const onFiles = vi.fn();
    expect(launchQueueOf({})).toBeNull();
    expect(launchQueueOf({ launchQueue: "nope" })).toBeNull();
    expect(launchQueueOf({ launchQueue: {} })).toBeNull();
    expect(consumeLaunchQueue({}, onFiles)).toBe(false);
    expect(onFiles).not.toHaveBeenCalled();
  });

  test("passes launched files on and ignores launches without files", () => {
    let consumer: ((params: LaunchParams) => void) | undefined;
    const target = {
      launchQueue: { setConsumer: (callback: (params: LaunchParams) => void) => (consumer = callback) },
    };
    const onFiles = vi.fn();
    expect(consumeLaunchQueue(target, onFiles)).toBe(true);

    consumer?.({ files: [] });
    expect(onFiles).not.toHaveBeenCalled();

    const launched = [handle(file("a.designhub.json", "{}"))];
    consumer?.({ files: launched });
    expect(onFiles).toHaveBeenCalledWith(launched);
  });
});

describe("takeSharedFile", () => {
  const storage = (stored: Map<string, Response>) => ({
    open: async () => ({
      match: async (key: string) => stored.get(key),
      delete: async (key: string) => stored.delete(key),
    }),
  });

  test("reads the shared file once and removes it", async () => {
    const stored = new Map([
      [
        SHARE_KEY,
        new Response(projectToJson(project("Shared")), { headers: { "x-file-name": "shared.designhub.json" } }),
      ],
    ]);
    const shared = await takeSharedFile(storage(stored) as unknown as Pick<CacheStorage, "open">);
    expect(shared?.name).toBe("shared.designhub.json");
    expect((await readProjectFile(shared!)).ok).toBe(true);
    expect(stored.size).toBe(0);
    expect(await takeSharedFile(storage(stored) as unknown as Pick<CacheStorage, "open">)).toBeNull();
  });
});
