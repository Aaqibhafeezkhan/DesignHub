import { describe, expect, test } from "vitest";

import { logoVariantSets } from "@/lib/logo/variant-sets";
import { logoVariants } from "@/lib/logo/variants";

describe("logo variant sets", () => {
  test("every variant is in exactly one set, and every set member exists", () => {
    const placed = logoVariantSets.flatMap((set) => set.variants);
    expect([...placed].sort()).toEqual(logoVariants.map((variant) => variant.id).sort());
    expect(new Set(placed).size).toBe(placed.length);
  });

  test("the first set holds few enough variants to show before any group is opened", () => {
    expect(logoVariantSets[0]?.variants.length).toBeLessThanOrEqual(4);
  });
});
