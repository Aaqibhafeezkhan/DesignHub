import type { DesignTokens } from "@/types/tokens";
import { header, presetTokens, tsLiteral } from "@/lib/tokens/formats/shared";
import { defineFormat } from "@/lib/tokens/formats/define";

/**
 * Panda CSS (panda.preset.ts): the shared preset tokens under `theme.extend`. List it in
 * `presets` after the base preset in panda.config.ts.
 */
export function toPandaPreset(tokens: DesignTokens): string {
  const preset = {
    name:
      tokens.meta.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "designhub",
    theme: { extend: presetTokens(tokens) },
  };
  return `${header(tokens, (text) => `// ${text}`)}
import { definePreset } from "@pandacss/dev";

export default definePreset(${tsLiteral(preset)});
`;
}

export const pandaFormat = defineFormat({
  id: "panda",
  label: "Panda CSS",
  filename: "panda.preset.ts",
  language: "ts",
  generate: toPandaPreset,
});
