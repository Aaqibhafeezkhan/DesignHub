import type { FontMetrics } from "@/lib/typography/fallback";

export type FontInspection = {
  family: string;
  subfamily: string;
  designer?: string;
  version?: string;
  glyphs: number;
  unitsPerEm: number;
  features: string[];
  axes: { tag: string; min: number; max: number; default: number }[];
  /** Vertical and average-width metrics when the OpenType tables expose them. */
  metrics?: FontMetrics;
};

const SUPPORTED = /\.(otf|ttf|woff)$/i;

export function isInspectableFont(file: File): boolean {
  return SUPPORTED.test(file.name);
}

type OpenTypeTables = {
  hhea?: { ascender?: number; descender?: number; lineGap?: number };
  os2?: {
    sTypoAscender?: number;
    sTypoDescender?: number;
    sTypoLineGap?: number;
    xAvgCharWidth?: number;
    fsSelection?: number;
  };
};

const USE_TYPO_METRICS = 1 << 7;

/** Prefer OS/2 typo metrics when the font asks for them; otherwise use hhea. */
export function metricsFromTables(unitsPerEm: number, tables: OpenTypeTables): FontMetrics | undefined {
  const os2 = tables.os2;
  const hhea = tables.hhea;
  const useTypo = Boolean(os2 && (os2.fsSelection ?? 0) & USE_TYPO_METRICS);

  const ascent = useTypo ? os2?.sTypoAscender : (hhea?.ascender ?? os2?.sTypoAscender);
  const rawDescent = useTypo ? os2?.sTypoDescender : (hhea?.descender ?? os2?.sTypoDescender);
  const lineGap = useTypo ? (os2?.sTypoLineGap ?? 0) : (hhea?.lineGap ?? os2?.sTypoLineGap ?? 0);
  const avgCharWidth = os2?.xAvgCharWidth;

  if (
    ascent === undefined ||
    rawDescent === undefined ||
    avgCharWidth === undefined ||
    unitsPerEm <= 0 ||
    avgCharWidth <= 0
  ) {
    return undefined;
  }

  return {
    ascent: Math.abs(ascent),
    descent: Math.abs(rawDescent),
    lineGap: Math.abs(lineGap),
    unitsPerEm,
    avgCharWidth,
  };
}

/** Parses a local font file with opentype.js (loaded on demand) and lists its layout features. */
export async function inspectFont(buffer: ArrayBuffer, fallbackName: string): Promise<FontInspection> {
  const { parse } = await import("opentype.js");
  const font = parse(buffer);
  const tags = [...(font.tables.gsub?.features ?? []), ...(font.tables.gpos?.features ?? [])].map((f) => f.tag);
  const metrics = metricsFromTables(font.unitsPerEm, font.tables as OpenTypeTables);

  return {
    family: font.names.fontFamily?.en ?? fallbackName,
    subfamily: font.names.fontSubfamily?.en ?? "Regular",
    designer: font.names.designer?.en,
    version: font.names.version?.en,
    glyphs: font.numGlyphs,
    unitsPerEm: font.unitsPerEm,
    features: [...new Set(tags)].sort(),
    axes: (font.tables.fvar?.axes ?? []).map((axis) => ({
      tag: axis.tag,
      min: axis.minValue,
      max: axis.maxValue,
      default: axis.defaultValue,
    })),
    ...(metrics ? { metrics } : {}),
  };
}

/** Registers the file with the browser so it can be previewed like any web font. */
export async function registerLocalFont(buffer: ArrayBuffer, family: string): Promise<void> {
  const face = new FontFace(family, buffer);
  await face.load();
  document.fonts.add(face);
}
