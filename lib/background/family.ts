import type {
  BackgroundCategory,
  BackgroundDefinition,
  BackgroundKind,
  BackgroundSettings,
  BackgroundVariantDefinition,
} from "@/types/background";

/** The variant the settings ask for, or the family's first when it is missing or belongs to another family. */
export function variantOf(
  settings: Pick<BackgroundSettings, "options">,
  variants: BackgroundVariantDefinition[],
): BackgroundVariantDefinition {
  return variants.find((item) => item.variant === settings.options?.variant) ?? variants[0]!;
}

/**
 * A generator made of several looks that share the same controls. The settings pick the look through
 * `options.variant`, and a look draws exactly what its own generator drew before they were merged.
 */
export function backgroundFamily(
  definition: { kind: BackgroundKind; category: BackgroundCategory; label: string; description: string },
  variants: BackgroundVariantDefinition[],
): BackgroundDefinition {
  return {
    ...definition,
    variants,
    defaults: variants[0]!.defaults,
    render: (settings) => variantOf(settings, variants).render(settings),
    // Variants without native CSS return nothing, which falls back to an inline SVG.
    css: (settings) => variantOf(settings, variants).css?.(settings) ?? "",
  };
}
