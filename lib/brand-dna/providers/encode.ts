import type { DnaImage } from "@/lib/brand-dna/types";

/** The downscaled copy the on-device provider already prepared, as PNG base64 (no `data:` prefix). */
export function sampleToPngBase64(image: DnaImage): string {
  const canvas = document.createElement("canvas");
  canvas.width = image.sampleWidth;
  canvas.height = image.sampleHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not available.");
  const pixels = new Uint8ClampedArray(image.pixels);
  context.putImageData(new ImageData(pixels, image.sampleWidth, image.sampleHeight), 0, 0);
  return canvas.toDataURL("image/png").split(",")[1] ?? "";
}
