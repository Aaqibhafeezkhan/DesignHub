import type { DesignTokens } from "@/types/tokens";
import { flatten, header } from "@/lib/tokens/formats/shared";
import { defineFormat } from "@/lib/tokens/formats/define";

/**
 * Less variables. Values with functions (clamp, gradients, shadows with rgb()) are escaped
 * with ~"..." so Less passes them through instead of trying to evaluate the math.
 */
function toLess(tokens: DesignTokens): string {
  const name = (token: string) => `@${tokens.meta.prefix ? `${tokens.meta.prefix}-` : ""}${token.replace(/\./g, "_")}`;
  const value = (raw: string) => (raw.includes("(") ? `~"${raw.replace(/"/g, '\\"')}"` : raw);
  const vars = flatten(tokens)
    .map((token) => `${name(token.name)}: ${value(token.value)};`)
    .join("\n");
  return `${header(tokens, (text) => `// ${text}`)}\n${vars}\n`;
}

export const lessFormat = defineFormat({
  id: "less",
  label: "Less",
  filename: "tokens.less",
  language: "css",
  generate: toLess,
});
