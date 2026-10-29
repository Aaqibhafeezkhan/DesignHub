"use client";

import { Download } from "lucide-react";

import { useI18n } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { downloadText } from "@/lib/download";
import { cn } from "@/lib/utils";

/** More than this many characters are not drawn: laying out a megabyte of text stalls the page. */
export const CODE_DISPLAY_LIMIT = 60_000;

type CodeBlockProps = {
  code: string;
  filename?: string;
  className?: string;
  maxHeight?: string;
};

export function CodeBlock({ code, filename, className, maxHeight = "28rem" }: CodeBlockProps) {
  const { t } = useI18n();
  // Minified output is one very long line; wrap it instead of forcing a horizontal scroll.
  const singleLine = !code.trimEnd().includes("\n");
  const clipped = code.length > CODE_DISPLAY_LIMIT;
  const shown = clipped ? code.slice(0, CODE_DISPLAY_LIMIT) : code;
  return (
    <figure className={cn("flex min-w-0 flex-col overflow-hidden rounded-lg border bg-surface", className)}>
      <figcaption className="flex h-10 items-center justify-between gap-2 border-b px-3">
        <span className="truncate font-mono text-xs text-muted-foreground">{filename ?? "snippet"}</span>
        <span className="flex items-center gap-1">
          {filename ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label={t("code.download", { filename })}
              onClick={() => downloadText(code, filename)}
            >
              <Download />
            </Button>
          ) : null}
          <CopyButton value={code} label={t("code.copy")} className="size-7" toastMessage={t("code.copied")} />
        </span>
      </figcaption>
      <pre
        tabIndex={0}
        aria-label={filename ? t("code.contents", { filename }) : t("code.label")}
        className={cn(
          "overflow-auto p-4 font-mono text-[12.5px] leading-relaxed scrollbar-thin",
          singleLine && "break-all whitespace-pre-wrap",
        )}
        style={{ maxHeight }}
      >
        <code>{shown}</code>
      </pre>
      {clipped ? (
        <p className="border-t px-3 py-2 text-xs text-muted-foreground">
          {t("code.clipped", { shown: CODE_DISPLAY_LIMIT.toLocaleString(), total: code.length.toLocaleString() })}
        </p>
      ) : null}
    </figure>
  );
}
