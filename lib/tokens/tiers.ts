import type { ExportTier } from "@/types/export";

/**
 * Where each token format sits in the Export Engine and the CLI. Core is what most projects need: CSS and
 * its preprocessors, Tailwind, JS, JSON (DTCG), Style Dictionary and the design-tool formats. Frameworks
 * are the UI library themes. Platforms are native and tool targets. A format is listed by its id; the
 * Xcode color sets (`xcode-<role>`) share one entry. Every format must be here: a test fails otherwise,
 * so a new format is a deliberate choice of tier.
 */
const TIERS: Record<string, ExportTier> = {
  // Core
  css: "core",
  "css-properties": "core",
  "css-light-dark": "core",
  scss: "core",
  "sass-map": "core",
  less: "core",
  stylus: "core",
  "tailwind-v4": "core",
  "tailwind-config": "core",
  js: "core",
  json: "core",
  yaml: "core",
  "style-dictionary": "core",
  "style-dictionary-config": "core",
  "figma-variables": "core",
  "tokens-studio": "core",
  // Frameworks
  "angular-material": "frameworks",
  "nuxt-ui": "frameworks",
  "nuxt-ui-colors": "frameworks",
  tamagui: "frameworks",
  "radix-themes": "frameworks",
  unocss: "frameworks",
  panda: "frameworks",
  chakra: "frameworks",
  mantine: "frameworks",
  mui: "frameworks",
  vuetify: "frameworks",
  antd: "frameworks",
  bootstrap: "frameworks",
  shadcn: "frameworks",
  react: "frameworks",
  styled: "frameworks",
  vue: "frameworks",
  "react-native": "frameworks",
  // Platforms
  gtk: "platforms",
  android: "platforms",
  "android-theme": "platforms",
  "android-theme-night": "platforms",
  flutter: "platforms",
  swiftui: "platforms",
  compose: "platforms",
  maui: "platforms",
  winui: "platforms",
  qml: "platforms",
  godot: "platforms",
  uss: "platforms",
  "windows-terminal": "platforms",
  vscode: "platforms",
  xcode: "platforms",
};

/**
 * Formats that are still built but will be removed in 2.1, each with the reason. A deprecated format keeps
 * working, shows its note in the picker and in `designhub --help`, and is removed only after a release.
 */
const DEPRECATED: Record<string, string> = {
  gtk: "Rarely used. It will be removed in 2.1; copy the file you need before then.",
  stylus: "Rarely used. It will be removed in 2.1; the SCSS or Less export covers the same variables.",
};

/** The tier of a token format by id. The Xcode color sets (`xcode-primary`, ...) are one entry. */
export function tierOf(id: string): ExportTier | undefined {
  return TIERS[id.startsWith("xcode-") ? "xcode" : id];
}

/** The deprecation note for a format, or undefined when it is not deprecated. */
export function deprecationOf(id: string): string | undefined {
  return DEPRECATED[id];
}

/** Ids the tables name, for tests that check they are real formats. */
export const tierIds = Object.keys(TIERS);
export const deprecatedIds = Object.keys(DEPRECATED);

export const exportTiers: readonly ExportTier[] = ["core", "frameworks", "platforms"];
