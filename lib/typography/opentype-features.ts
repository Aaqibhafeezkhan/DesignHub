import type { OpenTypeFeatureTag, OpenTypeSettings } from "@/types/typography";

type FeatureDefinition = {
  tag: OpenTypeFeatureTag;
  label: string;
  sample: string;
};

export type FeatureGroup = {
  title: string;
  features: FeatureDefinition[];
};

export const featureGroups: FeatureGroup[] = [
  {
    title: "Ligatures",
    features: [
      { tag: "liga", label: "Standard ligatures", sample: "fi fl ffi" },
      { tag: "dlig", label: "Discretionary ligatures", sample: "ct st Th" },
      { tag: "kern", label: "Kerning", sample: "AV To Wa" },
    ],
  },
  {
    title: "Letter case",
    features: [
      { tag: "smcp", label: "Small caps", sample: "Small Caps" },
      { tag: "c2sc", label: "Caps to small caps", sample: "NASA HTML" },
      { tag: "case", label: "Case-sensitive forms", sample: "(HELLO)" },
    ],
  },
  {
    title: "Numbers",
    features: [
      { tag: "lnum", label: "Lining figures", sample: "0123456789" },
      { tag: "onum", label: "Oldstyle figures", sample: "0123456789" },
      { tag: "tnum", label: "Tabular figures", sample: "1,111.11" },
      { tag: "pnum", label: "Proportional figures", sample: "1,111.11" },
      { tag: "zero", label: "Slashed zero", sample: "0O0" },
      { tag: "frac", label: "Fractions", sample: "1/2 3/4" },
    ],
  },
  {
    title: "Stylistic sets",
    features: [
      { tag: "ss01", label: "Stylistic set 1", sample: "a g y" },
      { tag: "ss02", label: "Stylistic set 2", sample: "a g y" },
    ],
  },
];

/** Pairs that cannot be on at the same time. */
const exclusive: Partial<Record<OpenTypeFeatureTag, OpenTypeFeatureTag>> = {
  lnum: "onum",
  onum: "lnum",
  tnum: "pnum",
  pnum: "tnum",
};

export function toggleFeature(settings: OpenTypeSettings, tag: OpenTypeFeatureTag): OpenTypeSettings {
  const next = { ...settings, [tag]: !settings[tag] };
  const opposite = exclusive[tag];
  if (next[tag] && opposite) next[opposite] = false;
  return next;
}

/** Descriptions for feature tags reported by the font inspector. */
const featureNames: Record<string, string> = {
  aalt: "Access all alternates",
  calt: "Contextual alternates",
  case: "Case-sensitive forms",
  ccmp: "Glyph composition",
  c2sc: "Caps to small caps",
  dlig: "Discretionary ligatures",
  dnom: "Denominators",
  frac: "Fractions",
  kern: "Kerning",
  liga: "Standard ligatures",
  lnum: "Lining figures",
  locl: "Localized forms",
  mark: "Mark positioning",
  mkmk: "Mark to mark",
  numr: "Numerators",
  onum: "Oldstyle figures",
  ordn: "Ordinals",
  pnum: "Proportional figures",
  salt: "Stylistic alternates",
  sinf: "Scientific inferiors",
  smcp: "Small caps",
  subs: "Subscript",
  sups: "Superscript",
  swsh: "Swash",
  tnum: "Tabular figures",
  zero: "Slashed zero",
};

export function describeFeature(tag: string): string {
  if (/^ss\d\d$/.test(tag)) return `Stylistic set ${Number(tag.slice(2))}`;
  if (/^cv\d\d$/.test(tag)) return `Character variant ${Number(tag.slice(2))}`;
  return featureNames[tag] ?? tag;
}
