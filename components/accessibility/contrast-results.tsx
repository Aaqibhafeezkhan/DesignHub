"use client";

import { Check, Wand2, X } from "lucide-react";
import { useMemo } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { contrastPairs } from "@/lib/a11y/contrast";
import { cn } from "@/lib/utils";
import { useA11yStore } from "@/store/a11y-store";

export function ContrastResults() {
  const { t } = useI18n();
  const colors = useA11yStore((state) => state.colors);
  const setColors = useA11yStore((state) => state.setColors);
  const pairs = useMemo(() => contrastPairs(colors), [colors]);

  return (
    <Panel title={t("a11y.contrast.title")} description={t("a11y.contrast.description")}>
      <ul className="flex flex-col gap-2" aria-label={t("a11y.contrast.list")}>
        {pairs.map((item) => {
          const pass = item.ratio >= item.required;
          return (
            <li
              key={item.id}
              className={cn(
                "flex flex-col gap-2 rounded-md border p-3",
                pass ? "border-success/30" : "border-destructive/40",
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-md border text-xs font-semibold"
                  style={{ background: item.background, color: item.foreground }}
                  aria-hidden
                >
                  Aa
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">{t(`a11y.contrast.pair.${item.id}`)}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {t("a11y.contrast.ratio", { ratio: item.ratioLabel, required: item.required })}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground" title={t("a11y.contrast.apcaHint")}>
                    {t("a11y.contrast.apca", { lc: item.apca.toFixed(1), target: item.apcaTarget })}
                  </span>
                </div>
                {pass ? (
                  <Check className="size-4 text-success" aria-label={t("a11y.verdict.pass")} />
                ) : (
                  <X className="size-4 text-destructive" aria-label={t("a11y.verdict.fail")} />
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {item.required === 4.5
                  ? (
                      [
                        ["aa", item.aa],
                        ["aaLarge", item.aaLarge],
                        ["aaa", item.aaa],
                        ["aaaLarge", item.aaaLarge],
                      ] as const
                    ).map(([level, ok]) => (
                      <Badge key={level} variant={ok ? "success" : "destructive"}>
                        {t(`a11y.contrast.${level}`)}
                      </Badge>
                    ))
                  : null}
                {/* Advisory only: APCA is a draft, so it never changes the WCAG 2 verdict. */}
                <Badge variant={Math.abs(item.apca) >= item.apcaTarget ? "success" : "warning"}>
                  {Math.abs(item.apca) >= item.apcaTarget ? t("a11y.contrast.apcaOk") : t("a11y.contrast.apcaLow")}
                </Badge>
              </div>
              {!pass && item.suggestion ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="self-start"
                  onClick={() => setColors({ [item.fixes]: item.suggestion })}
                >
                  <Wand2 /> {t("a11y.contrast.use", { color: item.suggestion })}
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
