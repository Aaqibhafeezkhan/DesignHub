import { beforeEach, describe, expect, test, vi } from "vitest";

const decodeSvg = vi.hoisted(() => vi.fn());
const decodedToBlob = vi.hoisted(() => vi.fn());
const svgToPngBlob = vi.hoisted(() => vi.fn());
vi.mock("@/lib/icons/raster", () => ({ decodeSvg, decodedToBlob, svgToPngBlob }));

import { rasterize, rasterizeMany } from "@/lib/export/raster";

const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50"><rect width="100" height="50"/></svg>';

beforeEach(() => {
  decodeSvg.mockReset();
  decodedToBlob.mockReset();
  svgToPngBlob.mockReset();
  decodeSvg.mockResolvedValue({ decoded: true });
  decodedToBlob.mockImplementation(async (_image: unknown, width: number) => new Blob([new Uint8Array(width)]));
  svgToPngBlob.mockImplementation(async (_svg: string, width: number) => new Blob([new Uint8Array(width)]));
});

describe("rasterizeMany", () => {
  test("decodes the SVG once however many sizes are drawn, in the order asked for", async () => {
    const images = await rasterizeMany(svg, [4, 2, 1]);
    expect(decodeSvg).toHaveBeenCalledTimes(1);
    expect(decodedToBlob).toHaveBeenCalledTimes(3);
    expect(images.map((image) => [image.width, image.height])).toEqual([
      [400, 200],
      [200, 100],
      [100, 50],
    ]);
    expect(images[0]?.bytes.length).toBe(400);
  });

  test("caps the longest side, like a single rasterize", async () => {
    const [capped] = await rasterizeMany(svg, [1000], 500);
    const single = await rasterize(svg, 1000, 500);
    expect([capped?.width, capped?.height]).toEqual([single.width, single.height]);
    expect(capped?.width).toBe(500);
  });
});
