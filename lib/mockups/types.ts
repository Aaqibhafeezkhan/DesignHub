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

/** Print stationery, objects with the brand on them, devices that show it, and screens and documents. */
export type MockupCategory = "Print" | "Objects" | "Devices" | "Screens";

/** The categories in picker order. */
export const mockupCategories: readonly MockupCategory[] = ["Print", "Objects", "Devices", "Screens"];

/** A template as the picker lists it: everything about it except its drawing code, which loads when it is chosen. */
export type MockupTemplateInfo = {
  id: string;
  label: string;
  category: MockupCategory;
  description: string;
};

export type MockupTemplate = MockupTemplateInfo & {
  render: (ctx: MockupContext) => string;
};
