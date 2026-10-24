import type { DesignTokens } from "@/types/tokens";
import { flatten, header, variable } from "@/lib/tokens/formats/shared";
import { defineFormat } from "@/lib/tokens/formats/define";

/** Typed custom properties: each numeric or color token is registered so the browser can animate it. */
export function toCssProperties(tokens: DesignTokens): string {
  const syntaxes: Record<string, string> = {
    color: "<color>",
    semantic: "<color>",
    spacing: "<length>",
    radius: "<length>",
    text: "<length>",
  };
  const numbers = new Set(["font-weight-heading", "font-weight-body", "leading-heading", "leading-body"]);
  const blocks = flatten(tokens).flatMap((token) => {
    const syntax = numbers.has(token.name)
      ? "<number>"
      : token.name.startsWith("tracking-")
        ? "<length>"
        : syntaxes[token.group];
    if (!syntax) return [];
    return [
      `@property ${variable(tokens, token.name)} {\n  syntax: "${syntax}";\n  inherits: true;\n  initial-value: ${token.value};\n}\n`,
    ];
  });
  return `${header(tokens, (text) => `/* ${text} */`)}\n${blocks.join("\n")}`;
}

export const cssPropertiesFormat = defineFormat({
  id: "css-properties",
  label: "CSS @property",
  filename: "properties.css",
  language: "css",
  generate: toCssProperties,
});
