import { watch } from "node:fs";
import { basename, dirname } from "node:path";

import { run } from "./cli";

/** All of standard input, or an empty string when it is a terminal (nothing was piped in). */
async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) return "";
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

/**
 * Watches the folder that holds the file and filters by name, because many editors save by writing a
 * new file and renaming it over the old one, which ends a watcher on the file itself.
 */
function watchFile(file: string, onChange: () => void) {
  const name = basename(file);
  return watch(dirname(file), (_event, changed) => {
    if (changed === null || changed === undefined || changed === name) onChange();
  });
}

// Ctrl+C is a normal way to end watch mode, so it exits with code 0.
const interrupt = new AbortController();
process.once("SIGINT", () => interrupt.abort());

process.exitCode = await run(process.argv.slice(2), {
  out: (text) => process.stdout.write(text),
  err: (text) => process.stderr.write(text),
  cwd: process.cwd(),
  stdin: readStdin,
  watch: watchFile,
  signal: interrupt.signal,
});
