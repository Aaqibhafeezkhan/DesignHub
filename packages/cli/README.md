# designhub CLI

Build DesignHub design tokens from an exported project file, without opening the browser.

```sh
npx designhub build brand.designhub.json --format css,tailwind-v4 --out tokens/
```

- `designhub build <file> [--format <ids>] [--out <folder>]` writes the chosen formats (all of them by default) to the folder (`tokens/` by default).
- `designhub build -` reads the project from standard input, for pipelines: `cat brand.designhub.json | npx designhub build - --format css`.
- `designhub --help` lists every format id.
- The output is deterministic: the file headers use the project file's export time (or `--generated-at`), so the same file always builds the same files.
- Exit codes: `0` success, `1` unreadable or invalid file or unknown format, `2` bad usage.

The CLI imports the Export Engine's generators from the app (`lib/tokens`), so it can never disagree with what the browser downloads. `pnpm --filter designhub build` bundles it into `dist/designhub.mjs` with no runtime dependencies.
