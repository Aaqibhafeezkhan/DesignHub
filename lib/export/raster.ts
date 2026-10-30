import { decodedToBlob, decodeSvg, svgToPngBlob } from "@/lib/icons/raster";
import { svgDimensions } from "@/lib/svg-size";

export type RasterFormat = "png" | "jpeg" | "webp";

export type RasterImage = { bytes: Uint8Array; width: number; height: number; format?: RasterFormat };

/**
 * Rasterizes an SVG at `scale`× its intrinsic size (capped so huge canvases stay within browser limits).
 * JPEG keeps multi-page documents small; PNG is lossless and keeps transparency; WebP is several
 * times smaller than PNG and also keeps transparency, which suits websites.
 */
export async function rasterize(
  svg: string,
  scale = 2,
  maxSide = 8192,
  format: RasterFormat = "png",
): Promise<RasterImage> {
  const { width, height } = svgDimensions(svg);
  const factor = Math.min(scale, maxSide / Math.max(width, height));
  const w = Math.max(1, Math.round(width * factor));
  const h = Math.max(1, Math.round(height * factor));
  const blob = await svgToPngBlob(svg, w, h, `image/${format}`);
  return { bytes: new Uint8Array(await blob.arrayBuffer()), width: w, height: h, format };
}

/**
 * The same SVG at several scales, decoded once. A pack that needs a vector at more than one size (a PNG and a PDF
 * page, or two PNG sizes) used to decode it again for each. The images come back in the order of `scales`.
 */
export async function rasterizeMany(
  svg: string,
  scales: number[],
  maxSide = 8192,
  format: RasterFormat = "png",
): Promise<RasterImage[]> {
  const { width, height } = svgDimensions(svg);
  const decoded = await decodeSvg(svg);
  const images: RasterImage[] = [];
  for (const scale of scales) {
    const factor = Math.min(scale, maxSide / Math.max(width, height));
    const w = Math.max(1, Math.round(width * factor));
    const h = Math.max(1, Math.round(height * factor));
    const blob = await decodedToBlob(decoded, w, h, `image/${format}`);
    images.push({ bytes: new Uint8Array(await blob.arrayBuffer()), width: w, height: h, format });
  }
  return images;
}
