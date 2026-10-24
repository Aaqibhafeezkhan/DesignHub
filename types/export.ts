export type ExportLanguage =
  | "css"
  | "scss"
  | "json"
  | "ts"
  | "tsx"
  | "js"
  | "html"
  | "svg"
  | "xml"
  | "dart"
  | "swift"
  | "kotlin"
  | "text"
  | "vue"
  | "yaml"
  | "qml"
  | "svelte"
  | "astro";

/** Where a token format sits in the picker: what most projects need, UI library themes, or native and tool targets. */
export type ExportTier = "core" | "frameworks" | "platforms";

export type ExportFormat = {
  id: string;
  label: string;
  filename: string;
  language: ExportLanguage;
  code: string;
  /** Set on token formats: the group the picker and the CLI list the format under. */
  tier?: ExportTier;
  /** Set when the format is still built but will be removed: the reason, shown with the format. */
  deprecated?: string;
};
