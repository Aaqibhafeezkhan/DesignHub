/** A parsed command line: positional arguments plus `--flag` and `--option value` pairs. */
export type ParsedArgs = {
  positionals: string[];
  options: Map<string, string>;
  flags: Set<string>;
};

/** Options that take a value. Anything else starting with `--` is a boolean flag. */
const VALUE_OPTIONS = new Set(["format", "out", "generated-at"]);
const SHORT = new Map([
  ["f", "format"],
  ["o", "out"],
  ["w", "watch"],
  ["h", "help"],
  ["v", "version"],
]);

/**
 * A tiny argument parser: `--format css,tailwind-v4`, `--format=css`, `-f css`, `-h`, and `--` to end
 * the options. Throws a readable error for an option that needs a value and doesn't have one.
 */
export function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = { positionals: [], options: new Map(), flags: new Set() };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]!;
    if (arg === "--") {
      parsed.positionals.push(...argv.slice(i + 1));
      break;
    }
    if (!arg.startsWith("-") || arg === "-") {
      parsed.positionals.push(arg);
      continue;
    }
    const eq = arg.startsWith("--") ? arg.indexOf("=") : -1;
    const raw = arg.startsWith("--") ? arg.slice(2, eq === -1 ? undefined : eq) : arg.slice(1);
    const name = SHORT.get(raw) ?? raw;
    if (!VALUE_OPTIONS.has(name)) {
      parsed.flags.add(name);
      continue;
    }
    const value = eq === -1 ? argv[++i] : arg.slice(eq + 1);
    if (value === undefined || (eq === -1 && value.startsWith("-"))) {
      throw new Error(`Option --${name} needs a value.`);
    }
    parsed.options.set(name, value);
  }
  return parsed;
}
