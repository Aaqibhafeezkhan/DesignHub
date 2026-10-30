import { describe, expect, test } from "vitest";

import { cleanPaneState, paneOfId, STUDIO_OUTPUT_ID, STUDIO_PREVIEW_ID } from "@/lib/studio-panes";

describe("studio panes", () => {
  test("a saved pane state keeps studio ids with a real pane and drops the rest", () => {
    expect(cleanPaneState({ effects: "preview", logo: "nonsense", "Bad Id": "output", svg: 3 })).toEqual({
      effects: "preview",
    });
    expect(cleanPaneState(null)).toEqual({});
    expect(cleanPaneState(["controls"])).toEqual({});
  });

  test("only so many studios are kept", () => {
    const many = Object.fromEntries(Array.from({ length: 80 }, (_, index) => [`studio-${index}`, "output"]));
    expect(Object.keys(cleanPaneState(many))).toHaveLength(50);
  });

  test("the skip link targets map to their panes", () => {
    expect(paneOfId(STUDIO_PREVIEW_ID)).toBe("preview");
    expect(paneOfId(STUDIO_OUTPUT_ID)).toBe("output");
    expect(paneOfId("other")).toBeNull();
  });
});
