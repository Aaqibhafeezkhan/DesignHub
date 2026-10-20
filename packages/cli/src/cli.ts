import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";

import { parseArgs } from "./args";
import { buildTokenFiles, CliError, listFormats } from "./build";

export const VERSION = "1.0.0";

/** Where the CLI writes, so tests can capture it. */
export type Io = { out: (text: string) => void; err: (text: string) => void; cwd: string };

export async function helpText(): Promise<string> {
  const formats = await listFormats();
  const width = Math.max(...formats.map((format) => format.id.length));
  return `designhub ${VERSION}: build design tokens from a DesignHub project file.

Usage
  designhub build <project.designhub.json> [--format <ids>] [--out <folder>]

Options
  -f, --format <ids>   Comma separated formats to build (default: all of them)
  -o, --out <folder>   Folder to write to, created if needed (default: tokens)
      --generated-at   Timestamp for the file headers (default: the file's export time)
  -h, --help           Show this help
  -v, --version        Show the version

Formats
${formats.map((format) => `  ${format.id.padEnd(width)}  ${format.label} (${format.filename})`).join("\n")}

Example
  npx designhub build brand.designhub.json --format css,tailwind-v4 --out tokens/
`;
}

/** Runs the command line and returns the exit code: 0 on success, 1 for a bad file or format, 2 for bad usage. */
export async function run(argv: string[], io: Io): Promise<number> {
  try {
    const args = parseArgs(argv);
    if (args.flags.has("version")) {
      io.out(`${VERSION}\n`);
      return 0;
    }
    if (args.flags.has("help") || args.positionals.length === 0) {
      io.out(await helpText());
      return args.flags.has("help") ? 0 : 2;
    }
    const [command, file, ...extra] = args.positionals;
    if (command !== "build") {
      io.err(`Unknown command "${command}". Run designhub --help.\n`);
      return 2;
    }
    if (!file || extra.length) {
      io.err("Usage: designhub build <project.designhub.json> [--format <ids>] [--out <folder>]\n");
      return 2;
    }

    let text: string;
    try {
      text = await readFile(resolve(io.cwd, file), "utf8");
    } catch {
      throw new CliError(`Can't read "${file}".`);
    }
    const formats = args.options
      .get("format")
      ?.split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    const files = await buildTokenFiles(text, { formats, generatedAt: args.options.get("generated-at") });

    const out = resolve(io.cwd, args.options.get("out") ?? "tokens");
    for (const file of files) {
      const target = join(out, file.path);
      // Format ids and file names are fixed, but never write outside the folder whatever they hold.
      if (!target.startsWith(out + sep)) throw new CliError(`Refusing to write outside ${out}.`);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, file.data, "utf8");
    }
    io.out(
      `Wrote ${files.length} file${files.length === 1 ? "" : "s"} to ${(args.options.get("out") ?? "tokens").replace(/[\\/]+$/, "")}/\n`,
    );
    return 0;
  } catch (error) {
    if (error instanceof CliError || (error instanceof Error && error.message.startsWith("Option --"))) {
      io.err(`designhub: ${(error as Error).message}\n`);
      return error instanceof CliError ? 1 : 2;
    }
    throw error;
  }
}
