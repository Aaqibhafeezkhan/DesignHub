import { CREDIT_TEXT } from "@/lib/export/credit";
import { rasterize } from "@/lib/export/raster";
import { slugify } from "@/lib/logo/pack";
import { isCoreTemplate, socialTemplates } from "@/lib/social/registry";
import type { SocialContext } from "@/lib/social/types";
import { createZip, type ZipEntry } from "@/lib/zip";

/** Templates of the core platforms: the pack when nothing was chosen. The others are added by choice. */
export function defaultPackTemplates() {
  return socialTemplates.filter(isCoreTemplate);
}

/** Templates a pack will contain: the saved selection, or the core platforms when there is none. */
export function packTemplates(selection: string[] | null) {
  return selection ? socialTemplates.filter((template) => selection.includes(template.id)) : defaultPackTemplates();
}

/** The selected social templates as PNGs at their platform sizes, grouped by platform. */
export async function buildSocialPack(
  ctx: SocialContext,
  onProgress?: (done: number, total: number) => void,
  selection: string[] | null = null,
): Promise<Uint8Array> {
  const templates = packTemplates(selection);
  const base = slugify(ctx.brand.name);
  const entries: ZipEntry[] = [];
  const readme = [`${ctx.brand.name} social assets`, ""];
  let done = 0;
  for (const template of templates) {
    const image = await rasterize(template.render(ctx), 1);
    const name = `${slugify(template.platform)}/${base}-${template.id}.png`;
    entries.push({ name, data: image.bytes });
    readme.push(`${name}  ${template.width}x${template.height}  ${template.description}`);
    onProgress?.(++done, templates.length);
  }
  readme.push("", CREDIT_TEXT);
  entries.unshift({ name: "README.txt", data: `${readme.join("\n")}\n` });
  return createZip(entries);
}
