import { AlertTriangle, Check, X } from "lucide-react";

import { useI18n } from "@/components/layout/locale-provider";
import { cn } from "@/lib/utils";
import type { Verdict } from "@/lib/a11y/readability";

export type CheckItem = { id: string; label: string; value: string; verdict: Verdict; guidance: string };

export function CheckList({ items, label }: { items: CheckItem[]; label: string }) {
  const { t } = useI18n();
  const icons = {
    pass: <Check className="size-4 text-success" aria-label={t("a11y.verdict.pass")} />,
    warn: <AlertTriangle className="size-4 text-warning" aria-label={t("a11y.verdict.warn")} />,
    fail: <X className="size-4 text-destructive" aria-label={t("a11y.verdict.fail")} />,
  };
  return (
    <ul className="flex flex-col gap-1.5" aria-label={label}>
      {items.map((item) => (
        <li
          key={item.id}
          className={cn(
            "flex items-start gap-2 rounded-md border p-2.5",
            item.verdict === "pass"
              ? "border-success/25"
              : item.verdict === "warn"
                ? "border-warning/40"
                : "border-destructive/40",
          )}
        >
          <span className="mt-0.5 shrink-0">{icons[item.verdict]}</span>
          <span className="flex min-w-0 flex-col">
            <span className="flex flex-wrap items-baseline gap-x-2 text-sm">
              <span className="font-medium">{item.label}</span>
              <span className="font-mono text-xs text-muted-foreground">{item.value}</span>
            </span>
            <span className="text-xs text-muted-foreground">{item.guidance}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
