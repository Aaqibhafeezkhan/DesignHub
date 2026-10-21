# The `designhub` command line and CI

The CLI builds design tokens from a DesignHub project file, so a team can keep tokens in Git and in CI without opening the browser. This page covers how to run it, what it promises, and four copyable CI recipes. The package itself is described in [packages/cli/README.md](../packages/cli/README.md).

## Get a project file

In the app, open **Brand Projects** and use **Export** on a project. The file is named `<project>.designhub.json`. Commit it to your repository next to your code: it is the source of truth that the CLI reads.

## Run it

Once the package is published to npm, run it with `npx`:

```bash
npx designhub build brand.designhub.json --format css,tailwind-v4 --out tokens/
```

Until then, build it from a clone of this repository and call the bundle with Node 22 or later (it has no runtime dependencies):

```bash
pnpm install
pnpm --filter designhub build
node packages/cli/dist/designhub.mjs build brand.designhub.json --out tokens/
```

`designhub --help` lists every format id (`css`, `tailwind-v4`, `shadcn`, `swiftui`, ...). With no `--format`, every format is written. Formats that share a file name, such as the React and Vue `theme.ts`, go in a folder named after the format (`react/theme.ts`), exactly as in the Export Engine's ZIP.

## What it promises

- **Same output as the app.** The CLI imports the Export Engine's generators, so the files match what the browser downloads for the same project.
- **Deterministic.** The headers that carry a time use the project file's export time, so the same file always builds the same bytes. Pass `--generated-at <iso>` to set it yourself. This is what makes the drift check below safe.
- **Nothing outside the folder.** Files are only written inside `--out`.

## Watch mode

If you export from the app into a folder your dev server reads, let the CLI rebuild for you:

```bash
npx designhub build brand.designhub.json --format css,tailwind-v4 --out tokens/ --watch
```

It builds once, prints `Watching brand.designhub.json. Press Ctrl+C to stop.`, then rebuilds each time the file changes and prints one line per rebuild (`Wrote 2 files to tokens/`). `-w` is the short form.

- **Rapid saves build once.** Changes are debounced by 100 ms, so an editor that writes a file twice doesn't build twice.
- **An invalid file doesn't stop it.** The error goes to stderr (`designhub: That file isn't valid JSON.`) and the watcher waits for the next change. This also applies if the file is already invalid when you start.
- **Ctrl+C exits with code 0.** It is the normal way to stop watching.
- **It needs a real file.** `--watch` with `-` (standard input) is a usage error (code `2`), and a file that doesn't exist fails with code `1` because there is nothing to watch.

## Exit codes

| Code | Meaning                                                                                                                 |
| ---- | ----------------------------------------------------------------------------------------------------------------------- |
| `0`  | Success, or `--help` and `--version`.                                                                                   |
| `1`  | The file can't be read, isn't a valid project, there is nothing on stdin, or a format is unknown.                       |
| `2`  | Bad usage: no command, an unknown command, a missing file argument or an option without a value, or `--watch` with `-`. |

CI treats any non-zero code as a failed step, so a bad project file or a typo in `--format` fails the build with a one-line message on stderr.

## Recipe 1: build tokens in GitHub Actions

Build the tokens on every push and keep them as a build artifact:

```yaml
name: Tokens
on: [push, pull_request]

jobs:
  tokens:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 22
      - run: npx designhub build brand.designhub.json --format css,tailwind-v4 --out tokens
      - uses: actions/upload-artifact@v7
        with:
          name: tokens
          path: tokens/
```

## Recipe 2: fail when the committed tokens drift

Commit the generated `tokens/` folder, then make CI fail when it no longer matches the project file. Because the output is deterministic, a clean tree means they agree:

```yaml
- run: npx designhub build brand.designhub.json --format css,tailwind-v4 --out tokens
- name: Tokens are up to date
  run: git diff --exit-code -- tokens
```

If the check fails, run the same `build` command locally, commit the result and push.

## Recipe 3: commit the tokens automatically

A workflow can regenerate and commit them when the project file changes on `main`:

```yaml
name: Update tokens
on:
  push:
    branches: [main]
    paths: [brand.designhub.json]

permissions:
  contents: write

jobs:
  tokens:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 22
      - run: npx designhub build brand.designhub.json --format css,tailwind-v4 --out tokens
      - name: Commit
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add tokens
          git diff --cached --quiet || git commit -m "chore: update design tokens"
          git push
```

## Recipe 4: a monorepo

Keep one project file per brand and build each into its own package. A root script keeps the commands in one place:

```json
{
  "scripts": {
    "tokens": "designhub build brands/acme.designhub.json --format css,tailwind-v4 --out packages/acme-ui/tokens && designhub build brands/globex.designhub.json --format css --out packages/globex-ui/tokens"
  }
}
```

Run `pnpm tokens` locally, and `pnpm tokens && git diff --exit-code` in CI for the drift check. With `pnpm`, add `designhub` as a dev dependency of the root so the script finds the binary.

## Pipelines

`-` reads the project from standard input, so the file doesn't have to be on disk:

```bash
curl -s https://example.com/brand.designhub.json | npx designhub build - --format css --out tokens
```

An empty stdin is an error with exit code `1`, and the message tells you to pipe a file in.

## Troubleshooting

- **`Can't read "brand.designhub.json"`**: the path is relative to the directory you ran the command in. In CI that is the repository root unless a step sets `working-directory`.
- **`That file isn't a DesignHub project.`**: you exported something else (for example the Brand JSON, which holds tokens only). Export the project from Brand Projects instead.
- **`Unknown format`**: copy an id exactly from `designhub --help`.
- **The drift check fails on a fresh clone**: line endings. Add `* text=auto eol=lf` to `.gitattributes` so Windows runners and Linux runners write the same bytes.
