import { describe, expect, test } from "vitest";

import { allMockupTemplates } from "@/lib/mockups/all";
import { mockupLoaders } from "@/lib/mockups/loaders";
import { loadMockupTemplate, mockupTemplates } from "@/lib/mockups/registry";
import type { MockupTemplateInfo } from "@/lib/mockups/types";

const info = (): MockupTemplateInfo[] =>
  // JSON drops the function, which leaves exactly the listed fields.
  JSON.parse(JSON.stringify(allMockupTemplates)) as MockupTemplateInfo[];

describe("the light mockup template list", () => {
  test("template-info.json is the full list without the drawing code", async () => {
    // Written by `pnpm test -u`; any other run fails when it no longer matches the templates.
    await expect(`${JSON.stringify(info(), null, 2)}\n`).toMatchFileSnapshot("./template-info.json");
    expect(mockupTemplates).toEqual(info());
  });

  test("every template has a loader and every loader a template", () => {
    expect(Object.keys(mockupLoaders).sort()).toEqual(allMockupTemplates.map((template) => template.id).sort());
  });

  test("a loader returns the same template the full list holds", async () => {
    for (const template of allMockupTemplates) {
      const loaded = await loadMockupTemplate(template.id);
      expect(loaded?.render).toBe(template.render);
    }
    expect(await loadMockupTemplate("nope")).toBeUndefined();
  });
});
