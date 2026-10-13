"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import { Bookmark, Download, Plus, Redo2, Shuffle, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { useI18n } from "@/components/layout/locale-provider";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useHotkey } from "@/hooks/use-hotkeys";
import { randomColor } from "@/lib/color/generate";
import { paletteNames } from "@/lib/color/names";
import { createId } from "@/lib/id";
import { useLibraryStore } from "@/store/library-store";
import { MAX_SWATCHES, useColorStore } from "@/store/color-store";
import type { Oklch, Swatch } from "@/types/color";

const loadImportDialog = () => import("@/components/colors/palette-import-dialog").then((m) => m.PaletteImportDialog);

// The import dialog (a modal) loads the first time it's opened, not with the page.
const PaletteImportDialog = dynamic(loadImportDialog, { ssr: false });

export type PaletteAnnouncementKind = "generated" | "loaded";
export type PaletteAnnouncer = (kind: PaletteAnnouncementKind, swatches: Swatch[]) => void;

export function usePaletteAnnouncement() {
  const { t, plural } = useI18n();
  const [message, setMessage] = useState("");
  const announce = useCallback<PaletteAnnouncer>(
    (kind, swatches) => {
      const names = paletteNames(swatches.map((swatch) => swatch.color)).join(", ");
      const announcement =
        kind === "generated"
          ? t("colors.announcement.generated", { names })
          : t("colors.announcement.loaded", { names });
      const lockedCount = kind === "generated" ? swatches.filter((swatch) => swatch.locked).length : 0;
      const completeMessage =
        lockedCount > 0 ? `${announcement} ${plural("colors.announcement.locked", lockedCount)}` : announcement;

      // Clear first so repeating the same palette is still a live-region change.
      setMessage("");
      window.setTimeout(() => setMessage(completeMessage), 0);
    },
    [plural, t],
  );

  return { announce, message };
}

type PaletteToolbarProps = {
  /** Supplies colors for the next generation (harmony modes). */
  nextColors?: () => Oklch[];
  announce: PaletteAnnouncer;
};

export function PaletteToolbar({ nextColors, announce }: PaletteToolbarProps) {
  const { t } = useI18n();
  const swatches = useColorStore((state) => state.swatches);
  const selectedId = useColorStore((state) => state.selectedId);
  const generate = useColorStore((state) => state.generate);
  const undo = useColorStore((state) => state.undo);
  const redo = useColorStore((state) => state.redo);
  const addSwatch = useColorStore((state) => state.addSwatch);
  const canUndo = useColorStore((state) => state.past.length > 0);
  const canRedo = useColorStore((state) => state.future.length > 0);
  const savePalette = useLibraryStore((state) => state.savePalette);
  const [importOpen, setImportOpen] = useState(false);
  const [importMounted, setImportMounted] = useState(false);
  const importRef = useRef<HTMLButtonElement>(null);

  const run = () => {
    generate(nextColors?.());
    announce("generated", useColorStore.getState().swatches);
  };
  useHotkey("space", run);
  useHotkey("z", undo);
  useHotkey("shift+z", redo);

  function save() {
    const colors = swatches.map((swatch) => swatch.color);
    const name = paletteNames(colors).slice(0, 3).join(" · ");
    savePalette({ id: createId("pal"), name, colors, createdAt: Date.now() });
    toast.success(t("colors.toolbar.saved"), { description: t("colors.toolbar.savedDescription") });
  }

  return (
    <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label={t("colors.toolbar.label")}>
      <Button onClick={run}>
        <Shuffle /> {t("colors.toolbar.generate")}
        <Kbd className="border-transparent bg-primary-foreground/15 text-primary-foreground">
          {t("colors.toolbar.space")}
        </Kbd>
      </Button>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" onClick={undo} disabled={!canUndo} aria-label={t("common.undo")}>
            <Undo2 />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t("colors.toolbar.undoHint")}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={redo}
            disabled={!canRedo}
            aria-label={t("colors.toolbar.redo")}
          >
            <Redo2 />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t("colors.toolbar.redoHint")}</TooltipContent>
      </Tooltip>
      <Button
        variant="outline"
        onClick={() => addSwatch(randomColor(), selectedId ?? undefined)}
        disabled={swatches.length >= MAX_SWATCHES}
      >
        <Plus /> {t("colors.toolbar.add")}
      </Button>
      <Button
        ref={importRef}
        variant="outline"
        aria-haspopup="dialog"
        aria-expanded={importOpen}
        aria-controls={importOpen ? "palette-import" : undefined}
        data-state={importOpen ? "open" : "closed"}
        onPointerEnter={() => void loadImportDialog()}
        onFocus={() => void loadImportDialog()}
        onClick={() => {
          setImportMounted(true);
          setImportOpen(true);
        }}
      >
        <Download /> {t("common.import")}
      </Button>
      {importMounted ? (
        <PaletteImportDialog open={importOpen} onOpenChange={setImportOpen} triggerRef={importRef} />
      ) : null}
      <Button variant="outline" onClick={save}>
        <Bookmark /> {t("common.save")}
      </Button>
      <p className="ml-auto hidden text-xs text-subtle-foreground md:block">{t("colors.toolbar.lockTip")}</p>
    </div>
  );
}
