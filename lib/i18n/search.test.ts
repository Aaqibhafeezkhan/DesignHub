import { describe, expect, it } from "vitest";

import { locales } from "@/lib/i18n/locales";
import { matchLocales } from "@/lib/i18n/search";

describe("matchLocales", () => {
  it("lists every language for the word language in any interface language", () => {
    for (const word of ["language", "Lang", "idioma", "Langue", "भाषा"]) {
      expect(matchLocales(word), word).toEqual([...locales]);
    }
  });

  it("lists every language for the translated group label", () => {
    expect(matchLocales("Sprache", "Sprache")).toEqual([...locales]);
  });

  it("finds a language by its own name, ignoring case and accents", () => {
    expect(matchLocales("Español")).toEqual(["es"]);
    expect(matchLocales("espanol")).toEqual(["es"]);
    expect(matchLocales("FRANCAIS")).toEqual(["fr"]);
    expect(matchLocales("हिन्दी")).toEqual(["hi"]);
    expect(matchLocales("engl")).toEqual(["en"]);
  });

  it("finds a language by its code", () => {
    expect(matchLocales("fr")).toEqual(["fr"]);
  });

  it("returns nothing for short or unrelated queries", () => {
    expect(matchLocales("")).toEqual([]);
    expect(matchLocales("l")).toEqual([]);
    expect(matchLocales("zzzz")).toEqual([]);
  });
});
