import { localeNames, locales, type Locale } from "@/lib/i18n/locales";

/** The word for "language" in every interface language, so any of them finds the list. */
const languageWords = ["language", "idioma", "langue", "भाषा"];

/** Lowercases and drops accents, so "espanol" finds "Español". */
function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

/**
 * The languages a command palette query refers to: all of them for "language" (in any interface
 * language, or the current group label), and just the matching ones for part of a language's own
 * name or code. Needs two characters, so single keystrokes do not fill the palette.
 */
export function matchLocales(query: string, groupLabel = ""): Locale[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  if ([...languageWords, groupLabel].some((word) => word && normalize(word).includes(q))) return [...locales];
  return locales.filter((locale) => normalize(localeNames[locale]).includes(q) || locale === q);
}
