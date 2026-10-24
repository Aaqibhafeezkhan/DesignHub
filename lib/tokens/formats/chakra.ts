import type { DesignTokens } from "@/types/tokens";
import { header, presetTokens, tsLiteral } from "@/lib/tokens/formats/shared";
import { defineFormat } from "@/lib/tokens/formats/define";

/**
 * Chakra UI v3 (theme.ts): the shared preset tokens as a `defineConfig` theme, merged onto
 * Chakra's default config with `createSystem`. Pass it to `<ChakraProvider value={system}>`.
 */
export function toChakraTheme(tokens: DesignTokens): string {
  return `${header(tokens, (text) => `// ${text}`)}
import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: ${tsLiteral(presetTokens(tokens), "  ")},
});

export const system = createSystem(defaultConfig, config);

export default system;
`;
}

export const chakraFormat = defineFormat({
  id: "chakra",
  label: "Chakra UI",
  filename: "theme.ts",
  language: "ts",
  generate: toChakraTheme,
});
