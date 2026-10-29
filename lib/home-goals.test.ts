import { describe, expect, test } from "vitest";

import { homeGoals } from "@/lib/home-goals";
import { catalogs } from "@/lib/i18n/all-catalogs";
import { locales } from "@/lib/i18n/locales";
import { en } from "@/lib/i18n/messages/en";
import { getStudio, studios } from "@/lib/navigation";

describe("home goals", () => {
  test("are about eight, each with its own id", () => {
    expect(homeGoals.length).toBeGreaterThanOrEqual(6);
    expect(homeGoals.length).toBeLessThanOrEqual(10);
    expect(new Set(homeGoals.map((goal) => goal.id)).size).toBe(homeGoals.length);
  });

  test("every goal links to a real studio route", () => {
    const hrefs = new Set(studios.map((studio) => studio.href));
    for (const goal of homeGoals) expect(hrefs.has(getStudio(goal.studio).href), goal.id).toBe(true);
  });

  test("every goal has a title and a body in English and in every language", () => {
    for (const goal of homeGoals) {
      for (const part of ["title", "body"]) {
        const key = `home.goal.${goal.id}.${part}`;
        expect(Object.hasOwn(en, key), key).toBe(true);
        for (const locale of locales) expect(Object.hasOwn(catalogs[locale], key), `${locale} ${key}`).toBe(true);
      }
    }
  });

  test("the home page keeps the full list of studios reachable by a count in its label", () => {
    expect(en["home.allStudios"]).toContain("{count}");
  });
});
