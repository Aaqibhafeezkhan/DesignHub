import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import manifest from "@/app/manifest";

const root = process.cwd();

/** A route's page file, whether it sits in a route group such as (studio) or (marketing) or not. */
function hasPage(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  return ["", "(studio)", "(marketing)"].some((group) => existsSync(join(root, "app", group, ...segments, "page.tsx")));
}

describe("web app manifest shortcuts", () => {
  const { shortcuts = [] } = manifest();

  test("lists the Colors, Typography, Brand Projects and Export studios", () => {
    expect(shortcuts.map((shortcut) => shortcut.url)).toEqual(["/colors", "/typography", "/projects", "/export"]);
  });

  test("every shortcut has a name and a short name, and points at a real route", () => {
    for (const shortcut of shortcuts) {
      expect(shortcut.name.length).toBeGreaterThan(0);
      expect(shortcut.short_name?.length ?? 0).toBeGreaterThan(0);
      expect(shortcut.url.startsWith("/")).toBe(true);
      expect(hasPage(shortcut.url), shortcut.url).toBe(true);
    }
  });

  test("shortcuts use icons the app already ships and stay inside the app's scope", () => {
    const { scope } = manifest();
    for (const shortcut of shortcuts) {
      for (const icon of shortcut.icons ?? []) {
        expect(existsSync(join(root, "public", icon.src.replace(/^\//, ""))), icon.src).toBe(true);
      }
      expect(shortcut.url.startsWith(scope ?? "/")).toBe(true);
    }
  });
});
