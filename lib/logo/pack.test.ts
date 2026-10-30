import { beforeEach, describe, expect, test, vi } from "vitest";

const rasterizeMany = vi.hoisted(() => vi.fn());
const rasterize = vi.hoisted(() => vi.fn());
vi.mock("@/lib/export/raster", () => ({ rasterizeMany, rasterize }));
vi.mock("@/lib/export/pdf", () => ({ imagesToPdf: vi.fn(async () => new Uint8Array([37, 80, 68, 70])) }));
vi.mock("@/lib/icons/favicon", () => ({ faviconEntries: vi.fn(async () => []) }));

import { buildLogoPack } from "@/lib/logo/pack";
import { logoVariants, variantContext } from "@/lib/logo/variants";
import { mockupContext } from "@/lib/test/draw-context";

beforeEach(() => {
  rasterizeMany.mockReset();
  rasterize.mockReset();
  rasterizeMany.mockImplementation(async (_svg: string, scales: number[]) =>
    scales.map(() => ({ bytes: new Uint8Array([1, 2, 3]), width: 10, height: 10 })),
  );
});

describe("buildLogoPack", () => {
  test("decodes each variant's SVG once, for its PDF page and every PNG size", async () => {
    const draw = mockupContext("light");
    const zip = await buildLogoPack(
      variantContext(draw.brand, draw.fontCss, (value, size) => draw.measure(value, "Inter", 600, size)),
      0.25,
    );
    expect(zip.length).toBeGreaterThan(0);
    // One decode per variant, with the 4x image first and one more image per fixed PNG size.
    expect(rasterizeMany).toHaveBeenCalledTimes(logoVariants.length);
    logoVariants.forEach((variant, index) => {
      const scales = rasterizeMany.mock.calls[index]?.[1] as number[];
      expect(scales).toHaveLength(1 + (variant.pngSizes?.length ?? 0));
      expect(scales[0]).toBe(4);
    });
    expect(rasterize).not.toHaveBeenCalled();
  });
});
