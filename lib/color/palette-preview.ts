import { contrastRatio, readableTextColor } from "@/lib/color/color";
import { roleColor } from "@/lib/tokens/native";
import type { Oklch } from "@/types/color";
import type { DesignTokens } from "@/types/tokens";

/** UI pieces drawn in the Color Studio export preview. */
export type PreviewSurfaceId = "card" | "button" | "link" | "input";

/**
 * Which semantic roles paint each preview piece. Surfaces fall back when a role
 * is missing (card -> background, accent -> primary). Button label text is not a
 * role: it is the readable black or white on the primary fill, matching exports.
 */
export const PREVIEW_ROLE_MAP = {
  card: { surface: "card", surfaceFallback: "background", text: "foreground" },
  button: { surface: "primary", text: "readable" },
  link: { surface: "background", text: "primary" },
  input: {
    surface: "card",
    surfaceFallback: "background",
    text: "foreground",
    border: "accent",
    borderFallback: "primary",
  },
} as const satisfies Record<
  PreviewSurfaceId,
  {
    surface: string;
    surfaceFallback?: string;
    text: string;
    border?: string;
    borderFallback?: string;
  }
>;

export type PreviewSurface = {
  id: PreviewSurfaceId;
  /** Role that supplied the fill (after fallback). */
  surfaceRole: string;
  /** Role that supplied the text, or "readable" for on-primary labels. */
  textRole: string;
  /** Role that supplied the border, when the piece has one. */
  borderRole?: string;
  background: Oklch;
  foreground: Oklch;
  border?: Oklch;
  /** WCAG contrast of the text on the fill. */
  contrast: number;
};

export type PalettePreviewTheme = {
  dark: boolean;
  page: Oklch;
  pageRole: string;
  surfaces: PreviewSurface[];
};

/** Resolve a role through `roleColor()`, then an optional fallback role. */
function resolveRole(
  tokens: DesignTokens,
  name: string,
  dark: boolean,
  fallback?: string,
): { role: string; value: Oklch } | undefined {
  const primary = roleColor(tokens, name, dark);
  if (primary) return { role: name, value: primary.value };
  if (!fallback || fallback === name) return undefined;
  const next = roleColor(tokens, fallback, dark);
  return next ? { role: fallback, value: next.value } : undefined;
}

/**
 * Maps semantic roles to the card, button, link and input surfaces for one theme.
 * Colors come only from `roleColor()` (plus readable on-primary text), so the
 * preview stays aligned with every themed export.
 */
export function palettePreviewTheme(tokens: DesignTokens, dark: boolean): PalettePreviewTheme | undefined {
  const page = resolveRole(tokens, "background", dark);
  if (!page) return undefined;

  const surfaces: PreviewSurface[] = [];

  for (const id of Object.keys(PREVIEW_ROLE_MAP) as PreviewSurfaceId[]) {
    const map = PREVIEW_ROLE_MAP[id];
    const surface = resolveRole(tokens, map.surface, dark, "surfaceFallback" in map ? map.surfaceFallback : undefined);
    if (!surface) continue;

    let textRole: string;
    let foreground: Oklch;
    if (map.text === "readable") {
      textRole = "readable";
      foreground = readableTextColor(surface.value);
    } else {
      const text = resolveRole(tokens, map.text, dark);
      if (!text) continue;
      textRole = text.role;
      foreground = text.value;
    }

    const borderSpec =
      "border" in map && map.border
        ? resolveRole(tokens, map.border, dark, "borderFallback" in map ? map.borderFallback : undefined)
        : undefined;

    surfaces.push({
      id,
      surfaceRole: surface.role,
      textRole,
      borderRole: borderSpec?.role,
      background: surface.value,
      foreground,
      border: borderSpec?.value,
      contrast: contrastRatio(foreground, surface.value),
    });
  }

  return { dark, page: page.value, pageRole: page.role, surfaces };
}

/** Light and dark themes for the live export preview. */
export function palettePreviewThemes(tokens: DesignTokens): PalettePreviewTheme[] {
  return [false, true]
    .map((dark) => palettePreviewTheme(tokens, dark))
    .filter((theme): theme is PalettePreviewTheme => theme !== undefined);
}
