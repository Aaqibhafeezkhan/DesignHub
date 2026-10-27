import { mockupLoaders } from "@/lib/mockups/loaders";
import mockupTemplateInfo from "@/lib/mockups/template-info.json";
import type { MockupTemplate, MockupTemplateInfo } from "@/lib/mockups/types";

/**
 * Every template as a light list (id, label, category), in picker order. The drawing code of a template is
 * loaded with `loadMockupTemplate`. `template-info.json` is written from the full list by
 * `lib/mockups/template-info.test.ts` (run `pnpm test -u` after adding or changing a template).
 */
export const mockupTemplates = mockupTemplateInfo as MockupTemplateInfo[];

export function getTemplate(id: string): MockupTemplateInfo | undefined {
  return mockupTemplates.find((template) => template.id === id);
}

const loaded = new Map<string, Promise<MockupTemplate>>();

/** A template with its drawing code, fetched the first time it is asked for and kept after that. */
export function loadMockupTemplate(id: string): Promise<MockupTemplate | undefined> {
  const load = mockupLoaders[id];
  if (!load) return Promise.resolve(undefined);
  let template = loaded.get(id);
  if (!template) {
    template = load();
    loaded.set(id, template);
  }
  return template;
}
