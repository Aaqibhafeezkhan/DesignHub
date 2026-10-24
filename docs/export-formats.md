# Adding an export format

The Export Engine turns one shared token model into many files. Each format is one function that takes the tokens and returns a string. The same function feeds the Export Engine tab, the all-formats ZIP and the `designhub` command line, so a format shows up in all three once it is registered.

This guide builds a small format end to end, then points at the real ones to copy from. For setup, code style and the pull request process, see [CONTRIBUTING.md](../CONTRIBUTING.md). The other extension guides follow the same shape: [mockup-templates.md](mockup-templates.md), [social-templates.md](social-templates.md) and [guidelines-pages.md](guidelines-pages.md).

## The pieces

| File                                 | What it does                                                                                                                                                                      |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `types/tokens.ts`                    | `DesignTokens`: the model every generator reads.                                                                                                                                  |
| `types/export.ts`                    | `ExportFormat` and the `ExportLanguage` names the code viewer understands.                                                                                                        |
| `lib/tokens/formats/<id>.ts`         | One module per format: its generator and one `defineFormat` entry. `shared.ts` and `shared-native.ts` hold what several share (`flatten`, `variable`, `yamlString`, `roleColor`). |
| `lib/tokens/formats.ts`              | `tokenFormatDefinitions`, the ordered list, and `tokenFormats()`. Also re-exports every generator under the old import path.                                                      |
| `lib/tokens/tiers.ts`                | The tier of each format (core, frameworks, platforms) and the deprecated ones.                                                                                                    |
| `lib/tokens/formats.test.ts`         | Tests for the formats. Add yours here (or in a new `*.test.ts` file next to it).                                                                                                  |
| `lib/test/xml.ts`                    | `xmlError(source)`: a dependency-free well-formedness check for XML formats.                                                                                                      |
| `packages/cli/src/build.ts`          | Builds formats for the command line from `tokenFormats()`. It needs no change when you add a format.                                                                              |
| `components/export/token-output.tsx` | The Export Engine's ZIP, built from `tokenFormats()` too.                                                                                                                         |

## The token model

A generator is a pure function of `DesignTokens` (`types/tokens.ts`). It never reads a store, so every export describes the same system and the CLI can run it without a browser:

```ts
export type DesignTokens = {
  meta: { name: string; prefix: string; generatedAt: string; colorFormat: ColorFormat };
  colors: ColorToken[]; // name, value (Oklch) and shades 50 to 950
  semantic: { name: string; ref: string; value: Oklch }[]; // primary, accent, background...
  gradient: Gradient | null;
  typography: { heading; body; steps; rhythm } | null;
  effects: { name: string; value: string }[]; // shadow and blur tokens
  spacing: { name: string; px: number }[];
  radius: { name: string; px: number }[];
};
```

Several parts can be missing or empty: a person can switch a section off, so `typography` and `gradient` may be `null` and the lists may be empty. Handle that without producing broken output.

## Helpers to reuse

Read these before writing your own string handling:

- `flatten(tokens)` (`formats/shared.ts`) returns one flat list of `{ group, name, value }` with colors already written in the notation the person chose (`meta.colorFormat`). The CSS, SCSS, Less, Stylus, YAML and Sass map formats all start from it, so they can never disagree about a name or a value. Names look like `color-indigo`, `color-indigo-500`, `spacing-4`, `radius-lg` and `text-xl`.
- `variable(tokens, name)` writes a CSS custom property name with the token prefix applied (`--acme-color-indigo`) and escapes the `.` in names like `spacing-0.5`.
- `yamlString(value)` quotes a YAML scalar only when YAML would misread it.
- `roleColor(tokens, roleName, dark)` (`formats/shared-native.ts`) gives a semantic role's color in light or dark mode. Dark mode swaps the background and foreground and lifts the other roles to their 300 (or 200) shade. Use it instead of inventing your own dark mapping, so every format agrees.
- `toHex`, `toRgb`, `formatColor`, `readableTextColor` and `contrastRatio` (`lib/color/color.ts`) convert and compare colors. A format that cannot express `oklch()` should write hex.
- `siteConfig.github` is the URL for the "generated by DesignHub" header comment.

Naming rules the native formats follow, so yours should too when it makes identifiers: letters and digits only, camelCase or PascalCase as the target language expects, and a prefix when a name would start with a digit (`indigo-500` becomes `indigo500`, and `0.5` becomes `s0_5`). Drop later duplicates, since two palette entries can produce the same identifier. The helpers for this (`pascal`, `ident`, `unique`, `colorEntries`) live in `formats/shared-native.ts`: import them from there rather than copying them.

Honour the token prefix everywhere (`tokens.meta.prefix`), put the header comment first in formats that allow comments, and end the file with a newline.

## Walkthrough: TOML

This format writes one TOML table per token group. It is small on purpose; every part of a real format is in it. The code below lives in `lib/tokens/export-format-guide.test.ts`, where it is compiled and tested with the guide.

```ts
/** A TOML key that is always valid: quoted, so names like "spacing-0.5" are fine. */
const tomlKey = (name: string) => JSON.stringify(name);

export function toToml(tokens: DesignTokens): string {
  const prefix = tokens.meta.prefix ? `${tokens.meta.prefix}-` : "";
  const groups = new Map<string, string[]>();
  for (const token of flatten(tokens)) {
    const rows = groups.get(token.group) ?? [];
    // JSON.stringify writes a valid TOML basic string: double quotes, with backslashes escaped.
    rows.push(`${tomlKey(prefix + token.name)} = ${JSON.stringify(token.value)}`);
    groups.set(token.group, rows);
  }
  const body = [...groups].map(([group, rows]) => `[${group}]\n${rows.join("\n")}`).join("\n\n");
  return `# ${tokens.meta.name} - design tokens generated by DesignHub (${siteConfig.github})\n\n${body}\n`;
}
```

Three things to notice:

1. **It starts from `flatten`.** The color notation, the names and the groups come for free and match the other formats.
2. **Keys are always quoted.** TOML bare keys cannot contain `.`, and a token like `spacing-0.5` has one.
3. **Values go through `JSON.stringify`.** A JSON string is a valid TOML basic string, so quotes and backslashes in an effect value cannot break the file.

### Light and dark roles

If your format has a notion of light and dark themes, read the roles through `roleColor` for both modes:

```ts
/** Light and dark values for every semantic role, through the shared `roleColor` helper. */
export function tomlRoles(tokens: DesignTokens): string {
  return ["light", "dark"]
    .map((mode) => {
      const rows = tokens.semantic.flatMap((role) => {
        const resolved = roleColor(tokens, role.name, mode === "dark");
        return resolved ? [`${tomlKey(role.name)} = ${JSON.stringify(resolved.value.l.toFixed(3))}`] : [];
      });
      return `[roles.${mode}]\n${rows.join("\n")}`;
    })
    .join("\n\n");
}
```

## Register it

Put the generator and a `defineFormat` entry in `lib/tokens/formats/<id>.ts`, add the entry to `tokenFormatDefinitions` in `formats.ts`, and give the id a tier in `tiers.ts` (a test fails without one). Its position in the array is its position in the Export Engine's picker:

```ts
export function tomlFormat(tokens: DesignTokens): ExportFormat {
  return { id: "toml", label: "TOML", filename: "tokens.toml", language: "text", code: toToml(tokens) };
}
```

- `id` is stable and kebab-case. The CLI's `--format` flag and the Export Engine use it, so renaming one is a breaking change.
- `filename` is what the download and the ZIP call the file. If two formats use the same file name (React and Vue both write `theme.ts`), the ZIP and the CLI put each in a folder named after its `id`, so you do not have to avoid the clash.
- `language` picks the code viewer's highlighting. Pick the closest name from `ExportLanguage` in `types/export.ts` (`text` is the plain fallback). Add a name there only if a new one is really needed.

That is all the wiring:

- The **Export Engine** shows the format in its picker and the preview.
- The **ZIP** is built from `tokenFormats(tokens)`, so the file is in it.
- The **CLI** lists it in `designhub --help` and builds it with `--format toml`. Nothing in `packages/cli` changes. See [cli.md](cli.md).

## Tests

Add tests to `lib/tokens/formats.test.ts`. The fixture there (`tokens()`) has a prefix option, an `indigo` color with a 250 shade and an `indigo-2` color with a 50 shade, which proves your names keep apart colors whose names overlap. Test:

- **What is specific to the format**: names, values and structure for a known input.
- **The prefix**: `tokens("acme")` puts the prefix on every key.
- **Awkward input**: a `.` in a name, a quote in an effect value, and the case with `typography: null` and empty lists.
- **Dark mode**, when the format has it, against `roleColor(tokens, role, true)`.
- **Well-formed output**: for XML, `expect(xmlError(code)).toBeNull()` using `lib/test/xml.ts`. For JSON, `JSON.parse`. For other languages, a small check of the shape (the guide's own test checks that every line is a header, a pair or blank).
- **Registration**: the id and file name are in `tokenFormats(tokens())`.

Finally, verify the output in a real project: paste it into the tool it is for. Tests prove the file is well formed, not that the tool accepts it.

## Before you open a pull request

- `pnpm typecheck && pnpm test && pnpm lint && pnpm format:check && pnpm check:dashes && pnpm build`
- Add the format to the README's Export Engine section and to `CHANGELOG.md`.
- If the format is for a tool with a version (Tailwind v4, Mantine v7), put the version in its `label` and the generator's comment.

## Real examples to copy from

| Format        | Where                     | Good for                                                       |
| ------------- | ------------------------- | -------------------------------------------------------------- |
| CSS variables | `formats/css.ts`          | The simplest `flatten`-based format.                           |
| YAML          | `toYaml` and `yamlString` | Quoting values a format would misread.                         |
| Mantine       | `toMantineTheme`          | A TypeScript theme with ten-shade tuples.                      |
| Vuetify       | `toVuetifyTheme`          | Light and dark sets built with `roleColor`.                    |
| WinUI / WPF   | `formats/winui.ts`        | An XML format, tested with `xmlError`.                         |
| Godot         | `formats/godot.ts`        | Identifiers, unique names and light and dark entries together. |
