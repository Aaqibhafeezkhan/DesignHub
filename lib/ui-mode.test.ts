import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import { cleanMode, startingMode, USED_APP_KEYS, uiModes } from "@/lib/ui-mode";

describe("Simple and Advanced mode", () => {
  test("a first visit starts Simple and a returning person starts Advanced, so nothing moves on them", () => {
    expect(startingMode(false)).toBe("simple");
    expect(startingMode(true)).toBe("advanced");
  });

  test("a saved mode is one of the two, or nothing", () => {
    for (const mode of uiModes) expect(cleanMode(mode)).toBe(mode);
    for (const bad of ["Simple", "", null, undefined, 1, {}]) expect(cleanMode(bad), String(bad)).toBeNull();
  });

  test("the keys that say a person used the app are real store names", () => {
    const stores = ["colors", "typography", "brand", "effects", "backgrounds", "project"];
    for (const key of USED_APP_KEYS) {
      const name = key.replace("designhub:", "");
      expect(stores, key).toContain(name);
      const source = readFileSync(
        join(
          __dirname,
          "..",
          "store",
          `${name === "colors" ? "color" : name === "backgrounds" ? "background" : name}-store.ts`,
        ),
        "utf8",
      );
      expect(source, key).toContain(`"${key}"`);
    }
  });
});
