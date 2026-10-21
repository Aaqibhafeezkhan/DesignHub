import { renderVariant, type VariantContext } from "@/lib/logo/variants";

/** The favicon's drawing: the app icon variant. The favicon package and the tab preview both use it. */
export function faviconSvg(ctx: VariantContext): string {
  return renderVariant("app-icon", ctx);
}

/** Pixel sizes the preview shows: the tab's own size and the one used on high density screens. */
export const FAVICON_PREVIEW_SIZES = [16, 32] as const;

export type TabTheme = { id: "light" | "dark"; label: string; strip: string; tab: string; text: string };

/** Neutral browser chrome colors, so the preview reads as a browser and not as the brand. */
export const TAB_THEMES: TabTheme[] = [
  { id: "light", label: "Light tab", strip: "#dee1e6", tab: "#ffffff", text: "#202124" },
  { id: "dark", label: "Dark tab", strip: "#1f2023", tab: "#35363a", text: "#e8eaed" },
];
