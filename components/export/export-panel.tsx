"use client";

import { useState } from "react";

import { CodeBlock } from "@/components/export/code-block";
import { useI18n } from "@/components/layout/locale-provider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ExportFormat } from "@/types/export";

type ExportPanelProps = {
  formats: ExportFormat[];
  label?: string;
};

/** Format switcher + code view with one-click copy and download. */
export function ExportPanel({ formats, label }: ExportPanelProps) {
  const { t } = useI18n();
  const [active, setActive] = useState(formats[0]?.id ?? "");
  const format = formats.find((item) => item.id === active) ?? formats[0];
  if (!format) return null;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <ToggleGroup
        type="single"
        value={format.id}
        onValueChange={(value) => value && setActive(value)}
        aria-label={label ?? t("code.format")}
        className="flex-wrap"
      >
        {formats.map((item) => (
          <ToggleGroupItem key={item.id} value={item.id}>
            {item.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <CodeBlock code={format.code} filename={format.filename} />
    </div>
  );
}
