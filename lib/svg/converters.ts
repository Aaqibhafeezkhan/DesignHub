import { kebabCase } from "@/lib/svg/angular";
import type { ExportFormat, ExportLanguage } from "@/types/export";

/**
 * The framework components the SVG Playground and Icon Studio both write. One list says what each one is
 * called, what its file is called and what language it is in, so the two studios can never disagree about a
 * label or a file name. What goes inside a component is written next to its framework in `lib/svg/`
 * (for a whole document) and `lib/icons/export.ts` (for an icon, which has its own header and no title prop).
 */
export const frameworkIds = [
  "react",
  "vue",
  "svelte",
  "solid",
  "preact",
  "qwik",
  "native",
  "angular",
  "lit",
  "astro",
] as const;

export type FrameworkId = (typeof frameworkIds)[number];

type Framework = {
  label: string;
  language: ExportLanguage;
  /** The file name for a component called `name` (PascalCase, such as `BadgeIcon`). */
  filename: (name: string) => string;
};

const frameworks: Record<FrameworkId, Framework> = {
  react: { label: "React", language: "tsx", filename: (name) => `${name}.tsx` },
  vue: { label: "Vue", language: "vue", filename: (name) => `${name}.vue` },
  svelte: { label: "Svelte", language: "svelte", filename: (name) => `${name}.svelte` },
  solid: { label: "Solid", language: "tsx", filename: (name) => `${name}.tsx` },
  preact: { label: "Preact", language: "tsx", filename: (name) => `${name}.tsx` },
  qwik: { label: "Qwik", language: "tsx", filename: (name) => `${name}.tsx` },
  native: { label: "React Native", language: "tsx", filename: (name) => `${name}.native.tsx` },
  angular: { label: "Angular", language: "ts", filename: (name) => `${kebabCase(name)}.component.ts` },
  lit: { label: "Lit", language: "ts", filename: (name) => `${kebabCase(name)}.ts` },
  astro: { label: "Astro", language: "astro", filename: (name) => `${name}.astro` },
};

/** An export of one framework's component, called `name`, with the code the studio wrote for it. */
export function frameworkFormat(id: FrameworkId, name: string, code: string): ExportFormat {
  const framework = frameworks[id];
  return { id, label: framework.label, filename: framework.filename(name), language: framework.language, code };
}
