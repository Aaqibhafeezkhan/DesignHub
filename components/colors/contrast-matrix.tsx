"use client";

import { useMemo } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { contrastRatio, toHex } from "@/lib/color/color";
import { ratingLabel } from "@/lib/color/contrast";
import { paletteNames } from "@/lib/color/names";
import { useColorStore } from "@/store/color-store";

/** Every palette pairing at a glance. Click a cell to inspect it above. */
export function ContrastMatrix() {
  const { t } = useI18n();
  const swatches = useColorStore((state) => state.swatches);
  const setContrast = useColorStore((state) => state.setContrast);
  const names = useMemo(() => paletteNames(swatches.map((swatch) => swatch.color)), [swatches]);

  return (
    <section aria-labelledby="matrix-title" className="flex flex-col gap-3">
      <h2 id="matrix-title" className="text-lg font-medium">
        {t("colors.matrix.title")}
      </h2>
      <div className="overflow-x-auto rounded-lg border scrollbar-thin">
        <table className="w-full border-collapse text-xs">
          <caption className="sr-only">{t("colors.matrix.caption")}</caption>
          <thead>
            <tr>
              <th scope="col" className="p-2 text-left font-medium text-subtle-foreground">
                {t("colors.matrix.corner")}
              </th>
              {swatches.map((swatch, index) => (
                <th key={swatch.id} scope="col" className="p-2">
                  <span className="flex items-center justify-center gap-1.5 font-medium capitalize">
                    <span className="size-3 rounded-sm border" style={{ background: toHex(swatch.color) }} />
                    {names[index]}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {swatches.map((row, rowIndex) => (
              <tr key={row.id} className="border-t">
                <th scope="row" className="p-2 text-left font-medium capitalize">
                  <span className="flex items-center gap-1.5">
                    <span className="size-3 rounded-sm border" style={{ background: toHex(row.color) }} />
                    {names[rowIndex]}
                  </span>
                </th>
                {swatches.map((column) => {
                  const same = row.id === column.id;
                  const ratio = contrastRatio(row.color, column.color);
                  const rating = t(`colors.rating.${ratingLabel(ratio)}` as const);
                  return (
                    <td key={column.id} className="p-1">
                      {same ? (
                        <span className="block text-center text-subtle-foreground">-</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setContrast({ fg: row.color, bg: column.color })}
                          aria-label={t("colors.matrix.cell", {
                            text: names[rowIndex] ?? "",
                            background: names[swatches.indexOf(column)] ?? "",
                            ratio: ratio.toFixed(2),
                            rating,
                          })}
                          className="flex h-12 w-full min-w-20 flex-col items-center justify-center rounded-md transition-transform duration-150 hover:scale-[1.03]"
                          style={{ background: toHex(column.color), color: toHex(row.color) }}
                        >
                          <span className="text-sm font-semibold tabular-nums">{ratio.toFixed(1)}</span>
                          <span className="text-[10px] opacity-80">{rating}</span>
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
