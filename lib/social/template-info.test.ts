import { describe, expect, test } from "vitest";

import { allSocialTemplates } from "@/lib/social/all";
import { socialLoaders } from "@/lib/social/loaders";
import { loadSocialTemplate, socialTemplates } from "@/lib/social/registry";
import type { SocialTemplateInfo } from "@/lib/social/types";

const info = (): SocialTemplateInfo[] =>
  // JSON drops the function, which leaves exactly the listed fields.
  JSON.parse(JSON.stringify(allSocialTemplates)) as SocialTemplateInfo[];

describe("the light social template list", () => {
  test("template-info.json is the full list without the drawing code", async () => {
    // Written by `pnpm test -u`; any other run fails when it no longer matches the templates.
    await expect(`${JSON.stringify(info(), null, 2)}\n`).toMatchFileSnapshot("./template-info.json");
    expect(socialTemplates).toEqual(info());
  });

  test("every template has a loader and every loader a template", () => {
    expect(Object.keys(socialLoaders).sort()).toEqual(allSocialTemplates.map((template) => template.id).sort());
  });

  test("a loader returns the same template the full list holds", async () => {
    for (const template of allSocialTemplates) {
      const loaded = await loadSocialTemplate(template.id);
      expect(loaded?.id).toBe(template.id);
      expect(loaded?.render).toBe(template.render);
    }
  });

  test("the old github id still loads and an unknown id loads nothing", async () => {
    expect((await loadSocialTemplate("github-banner"))?.id).toBe("github-classic");
    expect(await loadSocialTemplate("nope")).toBeUndefined();
  });
});
