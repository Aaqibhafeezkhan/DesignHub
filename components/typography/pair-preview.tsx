"use client";

import { useState } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { PairLayoutPreview } from "@/components/typography/pair-layouts";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { isPairLayout, pairLayouts, type PairLayout } from "@/lib/typography/pair-layouts";
import type { FontFamily } from "@/types/typography";

type PairPreviewProps = {
  heading: FontFamily | undefined;
  body: FontFamily | undefined;
  headingName: string;
  bodyName: string;
};

/** The pair in a blog article, a pricing card or a landing hero, with the fonts and colors of the brand. */
export function PairPreview({ heading, body, headingName, bodyName }: PairPreviewProps) {
  const { t } = useI18n();
  const [layout, setLayout] = useState<PairLayout>("article");

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ToggleGroup
          type="single"
          value={layout}
          onValueChange={(value) => value && isPairLayout(value) && setLayout(value)}
          aria-label={t("typography.pair.layout")}
        >
          {pairLayouts.map((item) => (
            <ToggleGroupItem key={item} value={item}>
              {t(`typography.pair.layout.${item}` as const)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="text-xs text-muted-foreground">
          {t("typography.pair.fonts", { heading: headingName, body: bodyName })}
        </p>
      </div>
      <PairLayoutPreview
        layout={layout}
        headingName={headingName}
        bodyName={bodyName}
        headingCategory={heading?.category}
        bodyCategory={body?.category}
      />
    </div>
  );
}
