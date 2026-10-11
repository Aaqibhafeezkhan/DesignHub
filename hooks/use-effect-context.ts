"use client";

import { useMemo } from "react";

import { inferRoles } from "@/lib/brand/tokens";
import { toHex } from "@/lib/color/color";
import { useBrandStore } from "@/store/brand-store";
import { useColorStore } from "@/store/color-store";
import type { EffectContext } from "@/types/effects";

/** State from other studios that effects build on, read live so it is never copied into effect settings. */
export function useEffectContext(): EffectContext {
  const gradient = useColorStore((state) => state.gradient);
  const swatches = useColorStore((state) => state.swatches);
  const roles = useBrandStore((state) => state.profile.roles);
  return useMemo(() => {
    const inferred = inferRoles(swatches, roles);
    const neutrals = swatches
      .filter((swatch) => inferred[swatch.id] === "neutral")
      .map((swatch) => toHex({ ...swatch.color, alpha: 1 }));
    return { gradient, neutrals };
  }, [gradient, swatches, roles]);
}
