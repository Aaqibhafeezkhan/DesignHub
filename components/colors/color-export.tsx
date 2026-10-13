"use client";

import { Brush, ChevronDown, Download, ImageDown, Loader2, Paintbrush, Palette, SwatchBook } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ExportPanel } from "@/components/export/export-panel";
import { useI18n } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { toHex } from "@/lib/color/color";
import {
  adobeSwatchExchange,
  colorExports,
  kritaPalette,
  namedPalette,
  paletteSvg,
  procreateSwatches,
  procreateSwatchLimit,
  sketchPalette,
} from "@/lib/color/export";
import { gradientCss } from "@/lib/color/gradient";
import { downloadBlob } from "@/lib/download";
import { errorMessage } from "@/lib/i18n/errors";
import type { PlainMessageKey } from "@/lib/i18n/translate";
import { rasterize } from "@/lib/export/raster";
import { slugify } from "@/lib/logo/pack";
import { useBrandStore } from "@/store/brand-store";
import { useColorStore } from "@/store/color-store";

const formatLabels: Partial<Record<string, PlainMessageKey>> = {
  css: "colors.export.format.css",
  json: "colors.export.format.json",
  svg: "colors.export.format.svg",
  gpl: "colors.export.format.gpl",
  sketch: "colors.export.sketch",
  markdown: "colors.export.format.markdown",
};

export function ColorExport() {
  const { t, plural } = useI18n();
  const swatches = useColorStore((state) => state.swatches);
  const gradient = useColorStore((state) => state.gradient);
  const format = useColorStore((state) => state.format);
  const shadeOptions = useColorStore((state) => state.shadeOptions);
  const brandName = useBrandStore((state) => state.profile.name);
  const [includeShades, setIncludeShades] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const formats = useMemo(
    () =>
      colorExports({
        colors: swatches.map((swatch) => swatch.color),
        gradient,
        format,
        includeShades,
        shadeOptions,
        name: brandName.trim() || undefined,
      }).map((item) => {
        // Only the tab label is translated; the file contents stay in English.
        const key = formatLabels[item.id];
        return key ? { ...item, label: t(key) } : item;
      }),
    [swatches, gradient, format, includeShades, shadeOptions, brandName, t],
  );

  const filename = (extension: string) => `${slugify(brandName.trim() || "brand")}-colors.${extension}`;
  const palette = () =>
    namedPalette(
      swatches.map((swatch) => swatch.color),
      shadeOptions,
    );

  /** The palette as a PNG strip (2x), one column per color with its name and hex code. */
  async function downloadPng() {
    if (swatches.length === 0) return;
    setDownloading(true);
    try {
      const image = await rasterize(paletteSvg(palette()), 2);
      const blob = new Blob([image.bytes.slice().buffer], { type: "image/png" });
      downloadBlob(blob, filename("png"));
      toast.success(t("colors.export.pngReady"));
    } catch (error) {
      toast.error(errorMessage(error, t, "colors.export.pngFailed"));
    } finally {
      setDownloading(false);
    }
  }

  /** The palette as Adobe Swatch Exchange for Photoshop, Illustrator and InDesign; shades follow the switch. */
  function downloadAse() {
    if (swatches.length === 0) return;
    const blob = new Blob([adobeSwatchExchange(palette(), includeShades)], { type: "application/octet-stream" });
    downloadBlob(blob, filename("ase"));
    toast.success(t("colors.export.aseReady"));
  }

  /** The palette for the Sketch Palettes plugin; shades follow the switch. */
  function downloadSketch() {
    if (swatches.length === 0) return;
    downloadBlob(
      new Blob([sketchPalette(palette(), includeShades)], { type: "application/json" }),
      filename("sketchpalette"),
    );
    toast.success(t("colors.export.sketchReady"));
  }

  /** Procreate swatches; shades go in only when the palette fits in Procreate's 30 slots. */
  function downloadProcreate() {
    if (swatches.length === 0) return;
    const result = procreateSwatches(palette(), includeShades, brandName.trim() || undefined);
    downloadBlob(new Blob([result.bytes], { type: "application/zip" }), filename("swatches"));
    const notes = [
      result.shadesDropped ? t("colors.export.shadesDropped") : "",
      result.colorsDropped > 0 ? plural("colors.export.colorsDropped", result.colorsDropped) : "",
    ].filter(Boolean);
    toast.success(t("colors.export.procreateReady"), {
      description: notes.length
        ? [t("colors.export.procreateLimit", { limit: procreateSwatchLimit }), ...notes].join(" ")
        : undefined,
    });
  }

  /** The palette for Krita; with shades, each color and its shades form a group. */
  function downloadKrita() {
    if (swatches.length === 0) return;
    const bytes = kritaPalette(palette(), includeShades, brandName.trim() || undefined);
    downloadBlob(new Blob([bytes], { type: "application/zip" }), filename("kpl"));
    toast.success(t("colors.export.kritaReady"));
  }

  const downloads = [
    { label: t("colors.export.png"), hint: ".png", icon: ImageDown, run: downloadPng },
    { label: t("colors.export.ase"), hint: ".ase", icon: SwatchBook, run: downloadAse },
    { label: t("colors.export.sketch"), hint: ".sketchpalette", icon: Palette, run: downloadSketch },
    { label: t("colors.export.procreate"), hint: ".swatches", icon: Brush, run: downloadProcreate },
    { label: t("colors.export.krita"), hint: ".kpl", icon: Paintbrush, run: downloadKrita },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-10 flex-1 overflow-hidden rounded-md border" aria-hidden>
          {swatches.map((swatch) => (
            <span key={swatch.id} className="flex-1" style={{ background: toHex(swatch.color) }} />
          ))}
          <span className="w-24" style={{ background: gradientCss(gradient) }} />
        </div>
        <div className="flex items-center gap-2">
          <Switch id="export-shades" checked={includeShades} onCheckedChange={setIncludeShades} />
          <Label htmlFor="export-shades">{t("colors.export.shades")}</Label>
        </div>
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline" disabled={downloading || swatches.length === 0}>
              {downloading ? <Loader2 className="animate-spin" /> : <Download />}
              {t("colors.export.download")}
              <ChevronDown className="opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-1" aria-label={t("colors.export.menu")}>
            {downloads.map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  setMenuOpen(false);
                  void item.run();
                }}
              >
                <item.icon />
                {item.label}
                <span className="ml-auto text-xs text-subtle-foreground">{item.hint}</span>
              </Button>
            ))}
          </PopoverContent>
        </Popover>
      </div>
      <p className="text-xs text-subtle-foreground">{t("colors.export.notation", { format: format.toUpperCase() })}</p>
      <ExportPanel formats={formats} label={t("colors.export.formatLabel")} />
    </div>
  );
}
