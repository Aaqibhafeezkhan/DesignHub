"use client";

import { useEffect } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { useInView } from "@/hooks/use-in-view";
import { fontStack } from "@/lib/typography/css";
import { googleFontsCssUrl, injectStylesheet } from "@/lib/typography/google-fonts";
import type { FontPair } from "@/lib/typography/pairing";
import { cn } from "@/lib/utils";
import type { FontFamily } from "@/types/typography";

type PairCardProps = {
  pair: FontPair;
  catalog: Map<string, FontFamily>;
  active: boolean;
  onSelect: (pair: FontPair) => void;
};

const SAMPLE_HEADING = "Design systems";
const SAMPLE_BODY = "Clear hierarchy and calm rhythm.";

export function PairCard({ pair, catalog, active, onSelect }: PairCardProps) {
  const { t } = useI18n();
  const { ref, inView } = useInView<HTMLButtonElement>();
  const heading = catalog.get(pair.heading);
  const body = catalog.get(pair.body);

  useEffect(() => {
    if (!inView) return;
    if (heading) injectStylesheet(googleFontsCssUrl(heading, { weight: 600, text: SAMPLE_HEADING + pair.heading }));
    if (body) injectStylesheet(googleFontsCssUrl(body, { weight: 400, text: SAMPLE_BODY + pair.body }));
  }, [inView, heading, body, pair.heading, pair.body]);

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onSelect(pair)}
      aria-pressed={active}
      aria-label={t("typography.pair.use", { heading: pair.heading, body: pair.body })}
      className={cn(
        "flex w-full flex-col gap-2 rounded-lg border bg-card p-4 text-left transition-[border-color,background-color] duration-150 hover:border-border-strong hover:bg-surface-raised",
        active && "border-brand/60",
      )}
    >
      <span className="text-xl font-semibold" style={{ fontFamily: fontStack(pair.heading, heading?.category) }}>
        {SAMPLE_HEADING}
      </span>
      <span className="text-sm text-muted-foreground" style={{ fontFamily: fontStack(pair.body, body?.category) }}>
        {SAMPLE_BODY}
      </span>
      <span className="pt-2 text-xs text-subtle-foreground">
        {pair.heading} + {pair.body}
        {pair.note ? ` · ${pair.note}` : ""}
      </span>
    </button>
  );
}
