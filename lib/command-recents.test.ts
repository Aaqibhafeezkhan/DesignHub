import { describe, expect, test } from "vitest";

import {
  cleanRecentCommands,
  isRecentCommand,
  MAX_RECENT_COMMANDS,
  pushRecentCommand,
  RECENT_ACTIONS,
} from "@/lib/command-recents";
import { studios } from "@/lib/navigation";

describe("recent commands", () => {
  test("knows every studio and every action, and nothing else", () => {
    for (const studio of studios) expect(isRecentCommand(`studio:${studio.id}`), studio.id).toBe(true);
    for (const action of RECENT_ACTIONS) expect(isRecentCommand(`action:${action}`), action).toBe(true);
    for (const bad of ["studio:gone", "action:launch", "colors", "", 3, null, undefined]) {
      expect(isRecentCommand(bad), String(bad)).toBe(false);
    }
  });

  test("puts the newest first and moves a repeat to the front", () => {
    let list = pushRecentCommand([], "studio:colors");
    list = pushRecentCommand(list, "studio:typography");
    list = pushRecentCommand(list, "studio:colors");
    expect(list).toEqual(["studio:colors", "studio:typography"]);
  });

  test("keeps at most five", () => {
    const ids = studios.slice(0, 8).map((studio) => `studio:${studio.id}` as const);
    const list = ids.reduce<string[]>((acc, id) => pushRecentCommand(acc, id), []);
    expect(list).toHaveLength(MAX_RECENT_COMMANDS);
    expect(list[0]).toBe(ids.at(-1));
  });

  test("drops a studio that no longer exists", () => {
    expect(pushRecentCommand(["studio:removed", "studio:colors"], "action:theme")).toEqual([
      "action:theme",
      "studio:colors",
    ]);
    expect(cleanRecentCommands(["studio:colors", "studio:removed", 4, "action:theme"])).toEqual([
      "studio:colors",
      "action:theme",
    ]);
  });

  test("saved data that is not a list is ignored", () => {
    for (const bad of [undefined, null, "studio:colors", { 0: "studio:colors" }, 7]) {
      expect(cleanRecentCommands(bad)).toEqual([]);
    }
  });
});
