import { LocalizedError } from "@/lib/i18n/errors";
import { defaultSnapshot } from "@/lib/projects/snapshot";
import { parseProjectsFile } from "@/lib/projects/transfer";
import { tokensFromSnapshot } from "@/lib/tokens/from-snapshot";
import { tokenFormats } from "@/lib/tokens/formats";
import { loadFontCatalog } from "@/lib/typography/catalog";
import type { ExportTier } from "@/types/export";

/** A readable failure the command line prints without a stack trace. */
export class CliError extends Error {}

export type CliFile = { path: string; data: string };

export type FormatListing = {
  id: string;
  label: string;
  filename: string;
  tier: ExportTier;
  /** Why the format will be removed, when it is deprecated. */
  deprecated?: string;
};

/** The id, label, file name, tier and deprecation note of every format, in the Export Engine's order. */
export async function listFormats(): Promise<FormatListing[]> {
  const tokens = tokensFromSnapshot(defaultSnapshot("Brand"), await loadFontCatalog(), new Date(0).toISOString());
  return tokenFormats(tokens).map(({ id, label, filename, tier, deprecated }) => ({
    id,
    label,
    filename,
    tier: tier ?? "core",
    ...(deprecated ? { deprecated } : {}),
  }));
}

/** The time recorded in the file, so the same file always builds the same output. */
function fileTime(text: string): string {
  try {
    const exportedAt: unknown = (JSON.parse(text) as { exportedAt?: unknown }).exportedAt;
    if (typeof exportedAt === "string" && !Number.isNaN(Date.parse(exportedAt))) return exportedAt;
  } catch {
    // parseProjectsFile reports the real error.
  }
  return new Date(0).toISOString();
}

/**
 * Builds the chosen token formats for the first project in a `.designhub.json` file. With no
 * `formats`, every format is built. Files that share a name (React and Vue both write theme.ts) go
 * in a folder per format, exactly as in the Export Engine's ZIP.
 */
export async function buildTokenFiles(
  text: string,
  options: { formats?: string[]; generatedAt?: string } = {},
): Promise<CliFile[]> {
  let entries;
  try {
    entries = parseProjectsFile(text);
  } catch (error) {
    // The app words these for the browser; the same English text reads fine on a command line.
    throw new CliError(error instanceof LocalizedError ? error.message : "The file could not be read.");
  }
  const entry = entries[0];
  if (!entry) throw new CliError("The file has no projects.");

  const tokens = tokensFromSnapshot(entry.snapshot, await loadFontCatalog(), options.generatedAt ?? fileTime(text));
  const all = tokenFormats(tokens);
  const chosen = options.formats?.length
    ? options.formats.map((id) => {
        const format = all.find((item) => item.id === id);
        if (!format) {
          throw new CliError(`Unknown format "${id}". Run designhub --help to see the formats.`);
        }
        return format;
      })
    : all;
  const shared = (filename: string) => all.filter((item) => item.filename === filename).length > 1;
  return chosen.map((format) => ({
    path: shared(format.filename) ? `${format.id}/${format.filename}` : format.filename,
    data: format.code,
  }));
}
