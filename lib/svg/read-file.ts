import { LocalizedError } from "@/lib/i18n/errors";

const MAX_SVG_BYTES = 2 * 1024 * 1024;

function isSvgFile(file: File): boolean {
  return file.type === "image/svg+xml" || /\.svg$/i.test(file.name);
}

/** Reads a dropped/uploaded SVG as text, rejecting non-SVG and oversized files. */
export async function readSvgFile(file: File): Promise<string> {
  if (!isSvgFile(file)) throw new LocalizedError("error.svg.type");
  if (file.size > MAX_SVG_BYTES) throw new LocalizedError("error.svg.size");
  return file.text();
}
