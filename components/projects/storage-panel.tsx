"use client";

import { useState } from "react";
import { toast } from "sonner";

import { useI18n } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { safeDb } from "@/lib/db";
import {
  clearOfflineCaches,
  measureOfflineCaches,
  measureRows,
  quotaShare,
  type CacheStore,
} from "@/lib/storage-report";
import { formatBytes } from "@/lib/svg-size";

type Report = {
  projects: { count: number; bytes: number };
  versions: { count: number; bytes: number };
  icons: { count: number; bytes: number };
  offline: { caches: number; files: number; bytes: number } | null;
  usage?: number;
  quota?: number;
};

/** Sizes and counts of what DesignHub keeps on this device. Nothing is read out of a project, only measured. */
export function StoragePanel() {
  const { t } = useI18n();
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);

  async function check() {
    setBusy(true);
    try {
      const [projects, versions, icons] = await Promise.all([
        safeDb((db) => db.projects.toArray(), []),
        safeDb((db) => db.versions.toArray(), []),
        safeDb((db) => db.icons.toArray(), []),
      ]);
      const estimate = await navigator.storage?.estimate?.().catch(() => undefined);
      const offline = typeof caches === "undefined" ? null : await measureOfflineCaches(caches).catch(() => null);
      setReport({
        projects: measureRows(projects),
        versions: measureRows(versions),
        icons: measureRows(icons),
        offline,
        usage: estimate?.usage,
        quota: estimate?.quota,
      });
    } finally {
      setBusy(false);
    }
  }

  async function clear() {
    if (typeof caches === "undefined") return;
    const store: CacheStore = { keys: () => caches.keys(), delete: (name) => caches.delete(name) };
    await clearOfflineCaches(store);
    toast.success(t("projects.storage.cleared"));
    await check();
  }

  const share = report ? quotaShare(report.usage, report.quota) : null;
  const rows = report
    ? [
        [t("projects.storage.projects"), `${report.projects.count} · ${formatBytes(report.projects.bytes)}`],
        [t("projects.storage.versions"), `${report.versions.count} · ${formatBytes(report.versions.bytes)}`],
        [t("projects.storage.icons"), `${report.icons.count} · ${formatBytes(report.icons.bytes)}`],
        [
          t("projects.storage.offline"),
          report.offline && report.offline.files > 0
            ? `${report.offline.files} · ${formatBytes(report.offline.bytes)}`
            : t("projects.storage.noCache"),
        ],
      ]
    : [];

  return (
    <Panel
      id="projects-storage"
      collapsible
      defaultOpen={false}
      title={t("projects.storage.title")}
      description={t("projects.storage.description")}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => void check()} disabled={busy}>
          {t("projects.storage.check")}
        </Button>
        {report?.offline && report.offline.files > 0 ? (
          <Button variant="outline" size="sm" onClick={() => void clear()}>
            {t("projects.storage.clear")}
          </Button>
        ) : null}
      </div>
      {report ? (
        <div className="flex flex-col gap-2" role="status">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            {rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-mono text-xs">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-muted-foreground">
            {share === null
              ? t("projects.storage.quotaUnknown")
              : t("projects.storage.quota", {
                  percent: share,
                  used: formatBytes(report.usage ?? 0),
                  quota: formatBytes(report.quota ?? 0),
                })}
          </p>
          {report.offline && report.offline.files > 0 ? (
            <p className="text-xs text-muted-foreground">{t("projects.storage.clearHint")}</p>
          ) : null}
        </div>
      ) : null}
    </Panel>
  );
}
