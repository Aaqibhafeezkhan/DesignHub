import { en } from "@/lib/i18n/messages/en";
import { es } from "@/lib/i18n/messages/es";
import { fr } from "@/lib/i18n/messages/fr";
import { hi } from "@/lib/i18n/messages/hi";
import type { Locale } from "@/lib/i18n/locales";
import type { Catalog } from "@/lib/i18n/translate";

/** Every language at once. Only the tests import this; the app loads the active language alone (`loadCatalog`). */
export const catalogs: Record<Locale, Catalog> = { en, es, fr, hi };
