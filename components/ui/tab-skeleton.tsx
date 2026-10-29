"use client";

import { useI18n } from "@/components/layout/locale-provider";

/** Placeholder while a lazily loaded studio tab downloads. */
export function TabSkeleton() {
  const { t } = useI18n();
  return (
    <div
      role="status"
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
      aria-busy="true"
      aria-label={t("common.loading")}
    >
      <div className="h-96 animate-pulse rounded-lg border bg-muted/40" />
      <div className="h-96 animate-pulse rounded-lg border bg-muted/40" />
    </div>
  );
}
