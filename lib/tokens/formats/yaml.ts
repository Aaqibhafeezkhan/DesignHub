import type { DesignTokens } from "@/types/tokens";
import { groupedTokens, header } from "@/lib/tokens/formats/shared";
import { defineFormat } from "@/lib/tokens/formats/define";

// YAML 1.1 and 1.2 read these plain scalars as booleans, null or numbers instead of strings.
const yamlReserved = /^(y|n|yes|no|on|off|true|false|null|~|[-+]?\.?(inf|nan))$/i;

const yamlNumber =
  /^[-+]?(0x[0-9a-f_]+|0o?[0-7_]+|0b[01_]+|[0-9][0-9_]*(\.[0-9_]*)?(e[-+]?[0-9]+)?|\.[0-9_]+(e[-+]?[0-9]+)?)$/i;

/**
 * A YAML scalar that always reads back as the same string. Plain words like `0.125rem` stay
 * bare; anything YAML could misread (`#fff` is a comment, `0.5` a number, `yes` a boolean,
 * `: ` a mapping) is double quoted, and a JSON string is a valid double-quoted YAML scalar.
 */
export function yamlString(value: string): string {
  const plain = /^[A-Za-z0-9][\w.%-]*$/.test(value) && !yamlReserved.test(value) && !yamlNumber.test(value);
  return plain ? value : JSON.stringify(value);
}

/** YAML (tokens.yaml): one mapping per group, written by hand so it needs no dependency. */
export function toYaml(tokens: DesignTokens): string {
  const groups = groupedTokens(tokens, tokens.meta.prefix ? `${tokens.meta.prefix}-` : "");
  const body = [...groups]
    .map(([group, values]) => {
      const rows = [...values].map(([key, value]) => `  ${yamlString(key)}: ${yamlString(value)}`);
      return `${group}:\n${rows.join("\n")}`;
    })
    .join("\n");
  return `${header(tokens, (text) => `# ${text}`)}\n${body}\n`;
}

export const yamlFormat = defineFormat({
  id: "yaml",
  label: "YAML",
  filename: "tokens.yaml",
  language: "yaml",
  generate: toYaml,
});
