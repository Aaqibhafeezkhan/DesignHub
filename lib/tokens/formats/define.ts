import type { ExportLanguage } from "@/types/export";
import type { DesignTokens } from "@/types/tokens";

/** One token format: how it is listed (id, label, file name, language) and how it is generated from the tokens. */
export type TokenFormatDefinition = {
  id: string;
  label: string;
  filename: string;
  language: ExportLanguage;
  generate: (tokens: DesignTokens) => string;
};

export function defineFormat(definition: TokenFormatDefinition): TokenFormatDefinition {
  return definition;
}
