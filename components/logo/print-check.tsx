"use client";

import { Check, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { SliderField } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { svgToDataUrl } from "@/lib/icons/svg";
import { logoAspect, nestLogo } from "@/lib/logo/compose";
import {
  inkFromRgba,
  measurePrintCheck,
  MM_PER_POINT,
  printCheckRasterWidth,
  printCheckVerdict,
  type PrintCheckVerdict,
} from "@/lib/logo/print-check";
import { monochromeSvg } from "@/lib/logo/recolor";

/** Line weights a press commonly holds, in points. */
const MINIMUMS = ["0.25", "0.5", "1"] as const;
/** The raster never gets taller than this, whatever the logo's shape. */
const MAX_HEIGHT = 1600;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not draw the logo"));
    image.src = src;
  });
}

/** The monochrome logo as ink on paper at a size, read back from a canvas. */
async function rasterInk(logo: string, width: number, height: number) {
  const mark = monochromeSvg(logo, "#000000");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${nestLogo(mark, { x: 0, y: 0, width, height })}</svg>`;
  const image = await loadImage(svgToDataUrl(svg));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas is not available");
  context.drawImage(image, 0, 0, width, height);
  return inkFromRgba(context.getImageData(0, 0, width, height).data, width, height);
}

/** Warns when the one-color logo has strokes or gaps thinner than the chosen print minimum. */
export function PrintCheck({ logo }: { logo: string }) {
  const [printWidth, setPrintWidth] = useState(40);
  const [minimumPoints, setMinimumPoints] = useState<(typeof MINIMUMS)[number]>("0.25");
  const settled = useDebouncedValue({ logo, printWidth, minimumPoints }, 300);
  const [verdict, setVerdict] = useState<PrintCheckVerdict | null>(null);
  const [failed, setFailed] = useState(false);
  const pending = settled.logo !== logo || settled.printWidth !== printWidth || settled.minimumPoints !== minimumPoints;

  useEffect(() => {
    let current = true;
    const minimumMm = Number(settled.minimumPoints) * MM_PER_POINT;
    const aspect = logoAspect(settled.logo);
    const widthPx = Math.min(printCheckRasterWidth(settled.printWidth, minimumMm), Math.floor(MAX_HEIGHT * aspect));
    const heightPx = Math.max(1, Math.round(widthPx / aspect));
    const pixelsPerMm = widthPx / settled.printWidth;
    rasterInk(settled.logo, widthPx, heightPx)
      .then((bitmap) => {
        if (!current) return;
        // Search up to a couple of times the minimum, which is all a verdict needs.
        const result = measurePrintCheck(bitmap, Math.max(2, minimumMm * pixelsPerMm * 2.5));
        setVerdict(printCheckVerdict(result, pixelsPerMm, minimumMm));
        setFailed(false);
      })
      .catch(() => current && setFailed(true));
    return () => {
      current = false;
    };
  }, [settled]);

  const body = useMemo(() => {
    if (failed)
      return <p className="text-xs text-muted-foreground">This browser could not draw the logo to check it.</p>;
    if (!verdict) return <p className="text-xs text-muted-foreground">Checking the logo...</p>;
    return <p className="text-xs text-muted-foreground">{verdict.summary}</p>;
  }, [failed, verdict]);

  return (
    <section aria-label="One-color print check" className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">One-color print check</h3>
      <div className="flex flex-col gap-4 rounded-lg border p-4">
        <SliderField
          label="Printed width of the mark"
          value={printWidth}
          min={10}
          max={120}
          step={5}
          onChange={setPrintWidth}
          format={(value) => `${value} mm`}
        />
        <div className="flex flex-col gap-1.5">
          <Label id="print-minimum-label">Thinnest line the press holds</Label>
          <ToggleGroup
            type="single"
            value={minimumPoints}
            onValueChange={(value) => value && setMinimumPoints(value as (typeof MINIMUMS)[number])}
            aria-labelledby="print-minimum-label"
          >
            {MINIMUMS.map((value) => (
              <ToggleGroupItem key={value} value={value}>
                {value} pt
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="flex flex-col gap-2 rounded-md border p-3" role="status" aria-live="polite">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">Monochrome mark</span>
            {pending || !verdict ? (
              <Badge variant="outline">
                <Loader2 className="animate-spin" aria-hidden /> Checking
              </Badge>
            ) : (
              <Badge variant={verdict.pass ? "success" : "destructive"}>
                {verdict.pass ? <Check aria-hidden /> : <X aria-hidden />}
                {verdict.pass ? "Pass" : "Warning"}
              </Badge>
            )}
          </div>
          {body}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        The one-color mark is drawn at its printed size and measured: strokes thinner than the minimum can fill in on
        embossing, foil and small print, and gaps thinner than it can close up. Use the heavier weight, or simplify the
        mark, if it warns.
      </p>
    </section>
  );
}
