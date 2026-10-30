import { CREDIT_TEXT } from "@/lib/export/credit";
import { imagesToPdf } from "@/lib/export/pdf";
import { rasterize, rasterizeMany } from "@/lib/export/raster";
import { faviconEntries, type FaviconOptions } from "@/lib/icons/favicon";
import { faviconSvg } from "@/lib/logo/favicon-preview";
import { logoVariants, type LogoVariantId, type VariantContext } from "@/lib/logo/variants";
import { svgDimensions } from "@/lib/svg-size";
import { createZip, type ZipEntry } from "@/lib/zip";

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "brand"
  );
}

/** Manifest values for a favicon package: the brand name and primary color. */
function faviconOptions(ctx: VariantContext): FaviconOptions {
  return { appName: ctx.name, themeColor: ctx.primary, backgroundColor: ctx.light };
}

/** Favicon files built from the brand's app icon variant. */
export async function faviconFiles(ctx: VariantContext, folder = ""): Promise<ZipEntry[]> {
  const svg = faviconSvg(ctx);
  const entries = await faviconEntries(() => svg, svg, faviconOptions(ctx));
  return entries.map((entry) => ({ ...entry, name: `${folder}${entry.name}` }));
}

export async function buildFaviconZip(ctx: VariantContext): Promise<Uint8Array> {
  return createZip(await faviconFiles(ctx));
}

export async function variantPng(ctx: VariantContext, id: LogoVariantId): Promise<Uint8Array> {
  const variant = logoVariants.find((item) => item.id === id) ?? logoVariants[0]!;
  return (await rasterize(variant.render(ctx), 4)).bytes;
}

export async function variantPdf(ctx: VariantContext, id: LogoVariantId): Promise<Uint8Array> {
  const variant = logoVariants.find((item) => item.id === id) ?? logoVariants[0]!;
  const image = await rasterize(variant.render(ctx), 4);
  return imagesToPdf([{ image }], { title: `${ctx.name} logo (${variant.label})`, scale: 4 });
}

function usageNotes(ctx: VariantContext, clearSpace: number): string {
  return [
    `${ctx.name} logo pack`,
    "",
    "Files: every variant as SVG (vector, preferred), PNG (4x) and PDF, plus a favicon/ folder built from the app icon.",
    "The avatar comes as PNG at 400 x 400 and 1024 x 1024, ready to upload as a profile picture.",
    "The monogram comes as PNG at 400 x 400 and 1024 x 1024, initials for avatars when there is no mark.",
    "The seal comes as PNG at 512 x 512 and 1024 x 1024, for stamps and stickers.",
    "The social share image comes as PNG at 1200 x 630 and 2400 x 1260, for og:image and link previews.",
    "",
    "Usage",
    `- Clear space: keep at least ${Math.round(clearSpace * 100)}% of the logo height free on every side.`,
    "- Minimum size: 24px for the mark on screen, 96px wide for the horizontal lockup.",
    "- Use the inverted variant on dark or busy backgrounds.",
    "- Don't stretch, rotate, recolor outside the palette, or add effects.",
    "",
    `Primary color: ${ctx.primary}`,
    `Heading font: ${ctx.fontFamily}`,
    "",
    CREDIT_TEXT,
    "",
  ].join("\n");
}

/** Every variant in SVG, PNG and PDF, plus usage notes, zipped. */
export async function buildLogoPack(ctx: VariantContext, clearSpace: number): Promise<Uint8Array> {
  const base = slugify(ctx.name);
  const entries: ZipEntry[] = [{ name: "README.txt", data: usageNotes(ctx, clearSpace) }];
  for (const variant of logoVariants) {
    const svg = variant.render(ctx);
    // Variants with fixed sizes (the avatar) export one square PNG per size instead of the 4x render. The SVG is
    // decoded once for the 4x image (the PDF page) and every size.
    const { width } = svgDimensions(svg);
    const sizes = variant.pngSizes ?? [];
    const [image, ...sized] = await rasterizeMany(svg, [4, ...sizes.map((size) => size / width)]);
    if (!image) throw new Error("Could not rasterize the logo");
    const pngs: ZipEntry[] = [];
    sizes.forEach((size, index) => {
      pngs.push({ name: `png/${base}-${variant.id}-${size}.png`, data: sized[index]!.bytes });
    });
    if (pngs.length === 0) pngs.push({ name: `png/${base}-${variant.id}.png`, data: image.bytes });
    entries.push({ name: `svg/${base}-${variant.id}.svg`, data: svg }, ...pngs, {
      name: `pdf/${base}-${variant.id}.pdf`,
      data: await imagesToPdf([{ image }], { title: `${ctx.name} ${variant.label}`, scale: 4 }),
    });
  }
  entries.push(...(await faviconFiles(ctx, "favicon/")));
  return createZip(entries);
}
