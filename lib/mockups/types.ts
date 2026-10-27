import type { BrandMode, BrandSurface, BrandTokens } from "@/types/brand";

export type MockupContent = {
  person: string;
  role: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  headline: string;
  cta: string;
};

/** What every brand drawing (mockups, social assets, guideline pages) is rendered from. */
export type DrawContext = {
  brand: BrandTokens;
  surface: BrandSurface;
  mode: BrandMode;
  fontCss: string;
  /** Text width in px in the given family (real font when loaded). */
  measure: (text: string, family: string, weight: number, size: number) => number;
};

export type MockupContext = DrawContext & { content: MockupContent };

type MockupCategory = "Print" | "Screens";

export type MockupTemplate = {
  id: string;
  label: string;
  category: MockupCategory;
  description: string;
  render: (ctx: MockupContext) => string;
};
