import type { BackgroundKind, BackgroundOptions, BackgroundSettings, BackgroundVariant } from "@/types/background";

/**
 * Kinds that were generators of their own before they were merged. A background saved or shared with
 * one of them loads as the merged generator with the matching variant, and draws the same SVG.
 */
export const legacyKinds: Record<string, { kind: BackgroundKind; variant: BackgroundVariant }> = {
  rings: { kind: "concentric", variant: "rings" },
  arcs: { kind: "concentric", variant: "arcs" },
  squares: { kind: "concentric", variant: "squares" },
  argyle: { kind: "woven", variant: "argyle" },
  plaid: { kind: "woven", variant: "plaid" },
  checks: { kind: "woven", variant: "checks" },
  zigzag: { kind: "zigzag", variant: "zigzag" },
  chevron: { kind: "zigzag", variant: "chevron" },
  squiggle: { kind: "zigzag", variant: "squiggle" },
};

/** Settings as saved by any version: an old kind becomes its merged generator and variant, anything else is kept. */
export function migrateBackgroundSettings(
  saved: Omit<BackgroundSettings, "kind"> & { kind: string },
): BackgroundSettings {
  const legacy = Object.hasOwn(legacyKinds, saved.kind) ? legacyKinds[saved.kind] : undefined;
  if (!legacy) return saved as BackgroundSettings;
  // A saved variant wins, so a background already saved as the merged generator is not changed.
  const options: BackgroundOptions = { ...saved.options, variant: saved.options?.variant ?? legacy.variant };
  return { ...saved, kind: legacy.kind, options };
}
