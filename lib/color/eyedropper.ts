import { fromHex } from "@/lib/color/color";
import type { Oklch } from "@/types/color";

export function fromEyeDropperResult(result: { sRGBHex: string }): Oklch {
  return fromHex(result.sRGBHex);
}
