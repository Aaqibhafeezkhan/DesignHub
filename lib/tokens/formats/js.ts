import type { DesignTokens } from "@/types/tokens";
import { flatten, header, objectKey } from "@/lib/tokens/formats/shared";
import { defineFormat } from "@/lib/tokens/formats/define";

/**
 * Plain JavaScript (ES module) for projects without TypeScript: one frozen object per scale
 * inside a frozen `tokens` object. Keys keep the token spelling ("indigo-2-50") so similar
 * names can't collide the way camelCase keys would, and start with the prefix setting.
 */
export function toJsModule(tokens: DesignTokens): string {
  const prefix = tokens.meta.prefix ? `${tokens.meta.prefix}-` : "";
  const groups = new Map<string, Map<string, string>>();
  flatten(tokens).forEach((token) => {
    const group = token.group === "semantic" ? "color" : token.group;
    const key = `${prefix}${token.name.replace(/^(color|gradient|font|text|spacing|radius)-/, "")}`;
    groups.set(group, (groups.get(group) ?? new Map()).set(key, token.value));
  });
  const scales = [...groups]
    .map(([group, values]) => {
      const rows = [...values].map(([key, value]) => `    ${objectKey(key)}: ${JSON.stringify(value)},`);
      return `  ${group}: Object.freeze({\n${rows.join("\n")}\n  }),`;
    })
    .join("\n");
  return `${header(tokens, (text) => `// ${text}`)}
export const tokens = Object.freeze({
${scales}
});

export default tokens;
`;
}

export const jsFormat = defineFormat({
  id: "js",
  label: "JavaScript",
  filename: "tokens.mjs",
  language: "js",
  generate: toJsModule,
});
