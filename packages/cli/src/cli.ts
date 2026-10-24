import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";

import { parseArgs, type ParsedArgs } from "./args";
import type { ExportTier } from "@/types/export";

import { buildTokenFiles, CliError, listFormats } from "./build";

export const VERSION = "1.0.0";

/** How long `--watch` waits after the last change before it rebuilds, so a burst of saves builds once. */
export const WATCH_DEBOUNCE_MS = 100;

/** A running file watcher, closed when the command ends. */
export type Watcher = { close: () => void };

/** Where the CLI writes, so tests can capture it. */
export type Io = {
  out: (text: string) => void;
  err: (text: string) => void;
  cwd: string;
  /** Reads all of standard input, for `designhub build -`. Missing when there is no piped input. */
  stdin?: () => Promise<string>;
  /** Calls `onChange` whenever the file at this absolute path changes. Needed for `--watch`. */
  watch?: (file: string, onChange: () => void) => Watcher;
  /** Ends `--watch` with exit code 0 when it aborts (Ctrl+C). */
  signal?: AbortSignal;
  /** Overrides `WATCH_DEBOUNCE_MS`, for tests. */
  debounceMs?: number;
};

/** The tiers in the order the help lists them. */
const TIER_NAMES: [ExportTier, string][] = [
  ["core", "Core"],
  ["frameworks", "Frameworks"],
  ["platforms", "Platforms"],
];

export async function helpText(): Promise<string> {
  const formats = await listFormats();
  const width = Math.max(...formats.map((format) => format.id.length));
  return `designhub ${VERSION}: build design tokens from a DesignHub project file.

Usage
  designhub build <project.designhub.json | -> [--format <ids>] [--out <folder>] [--watch]

Options
  -f, --format <ids>   Comma separated formats to build (default: all of them)
  -o, --out <folder>   Folder to write to, created if needed (default: tokens)
  -w, --watch          Rebuild whenever the project file changes. Press Ctrl+C to stop
      --generated-at   Timestamp for the file headers (default: the file's export time)
  -h, --help           Show this help
  -v, --version        Show the version

Formats
${TIER_NAMES.map(([tier, name]) => {
  const inTier = formats.filter((format) => format.tier === tier);
  if (inTier.length === 0) return "";
  const lines = inTier.map(
    (format) =>
      `  ${format.id.padEnd(width)}  ${format.label} (${format.filename})${format.deprecated ? ` [deprecated: ${format.deprecated}]` : ""}`,
  );
  return `${name}\n${lines.join("\n")}`;
})
  .filter(Boolean)
  .join("\n\n")}

Examples
  npx designhub build brand.designhub.json --format css,tailwind-v4 --out tokens/
  npx designhub build brand.designhub.json --out tokens/ --watch
  cat brand.designhub.json | npx designhub build - --format css
`;
}

/** Reads the project, builds the chosen formats and writes them. Returns the line to print. */
async function buildOnce(file: string, args: ParsedArgs, io: Io): Promise<string> {
  let text: string;
  if (file === "-") {
    // "-" means standard input, so the CLI can sit in a pipeline.
    text = io.stdin ? await io.stdin() : "";
    if (!text.trim()) throw new CliError("Nothing was piped in. Run: cat brand.designhub.json | designhub build -");
  } else {
    try {
      text = await readFile(resolve(io.cwd, file), "utf8");
    } catch {
      throw new CliError(`Can't read "${file}".`);
    }
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
  return `Wrote ${files.length} file${files.length === 1 ? "" : "s"} to ${(args.options.get("out") ?? "tokens").replace(/[\\/]+$/, "")}/\n`;
}

/** The message `run` prints for an error the user can fix, or undefined for anything unexpected. */
function readable(error: unknown): string | undefined {
  return error instanceof CliError || (error instanceof Error && error.message.startsWith("Option --"))
    ? (error as Error).message
    : undefined;
}

/**
 * Builds once, then again after every change to the project file. An invalid file prints its error and
 * the watcher keeps running, so the next save can fix it. Resolves with 0 when `io.signal` aborts.
 */
async function watchBuild(file: string, args: ParsedArgs, io: Io, watch: NonNullable<Io["watch"]>): Promise<number> {
  const rebuild = async () => {
    try {
      io.out(await buildOnce(file, args, io));
    } catch (error) {
      const message = readable(error) ?? (error instanceof Error ? error.message : "The build failed.");
      io.err(`designhub: ${message}\n`);
    }
  };

  // A change that arrives mid-build queues one more build instead of running two at once.
  let building = false;
  let queued = false;
  const build = async () => {
    if (building) {
      queued = true;
      return;
    }
    building = true;
    do {
      queued = false;
      await rebuild();
    } while (queued);
    building = false;
  };

  await build();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const watcher = watch(resolve(io.cwd, file), () => {
    clearTimeout(timer);
    timer = setTimeout(() => void build(), io.debounceMs ?? WATCH_DEBOUNCE_MS);
  });
  io.out(`Watching ${file}. Press Ctrl+C to stop.\n`);

  await new Promise<void>((done) => {
    if (io.signal?.aborted) return done();
    io.signal?.addEventListener("abort", () => done(), { once: true });
  });
  clearTimeout(timer);
  watcher.close();
  return 0;
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
      io.err("Usage: designhub build <project.designhub.json> [--format <ids>] [--out <folder>] [--watch]\n");
      return 2;
    }

    if (args.flags.has("watch")) {
      if (file === "-") {
        io.err("designhub: --watch needs a project file, not standard input.\n");
        return 2;
      }
      if (!io.watch) {
        io.err("designhub: --watch isn't available here.\n");
        return 2;
      }
      // Fail fast on a file that doesn't exist: there is nothing to watch.
      try {
        await readFile(resolve(io.cwd, file), "utf8");
      } catch {
        throw new CliError(`Can't read "${file}".`);
      }
      return await watchBuild(file, args, io, io.watch);
    }

    io.out(await buildOnce(file, args, io));
    return 0;
  } catch (error) {
    const message = readable(error);
    if (message !== undefined) {
      io.err(`designhub: ${message}\n`);
      return error instanceof CliError ? 1 : 2;
    }
    throw error;
  }
}
