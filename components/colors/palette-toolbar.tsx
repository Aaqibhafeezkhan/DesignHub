"use client";

import { useState } from "react";
import { Bookmark, Download, Plus, Redo2, Shuffle, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useHotkey } from "@/hooks/use-hotkeys";
import { parsePaletteImport } from "@/lib/color/import-palette";
import { randomColor } from "@/lib/color/generate";
import { paletteNames } from "@/lib/color/names";
import { createId } from "@/lib/id";
import { useLibraryStore } from "@/store/library-store";
import { createSwatch, MAX_SWATCHES, useColorStore } from "@/store/color-store";
import type { Oklch } from "@/types/color";

type PaletteToolbarProps = {
  /** Supplies colors for the next generation (harmony modes). */
  nextColors?: () => Oklch[];
};

export function PaletteToolbar({ nextColors }: PaletteToolbarProps) {
  const swatches = useColorStore((state) => state.swatches);
  const selectedId = useColorStore((state) => state.selectedId);
  const generate = useColorStore((state) => state.generate);
  const undo = useColorStore((state) => state.undo);
  const redo = useColorStore((state) => state.redo);
  const addSwatch = useColorStore((state) => state.addSwatch);
  const setSwatches = useColorStore((state) => state.setSwatches);
  const canUndo = useColorStore((state) => state.past.length > 0);
  const canRedo = useColorStore((state) => state.future.length > 0);
  const savePalette = useLibraryStore((state) => state.savePalette);
  const [importOpen, setImportOpen] = useState(false);
  const [importValue, setImportValue] = useState("");

  const run = () => generate(nextColors?.());
  useHotkey("space", run);
  useHotkey("z", undo);
  useHotkey("shift+z", redo);

  function save() {
    const colors = swatches.map((swatch) => swatch.color);
    const name = paletteNames(colors).slice(0, 3).join(" · ");
    savePalette({ id: createId("pal"), name, colors, createdAt: Date.now() });
    toast.success("Palette saved", { description: "Stored locally in your browser." });
  }

  function importPalette() {
    const result = parsePaletteImport(importValue);

    if (result.colors.length < 2) {
      toast.error("Import at least 2 colors", {
        description: "Paste a Coolors URL or text containing 2 or more hex codes.",
      });
      return;
    }

    setSwatches(result.colors.map((color) => createSwatch(color)));
    setImportValue("");
    setImportOpen(false);

    if (result.dropped > 0) {
      toast.success("Palette imported", {
        description:
          "Imported 10 colors and dropped " +
          result.dropped +
          " extra " +
          (result.dropped === 1 ? "color." : "colors."),
      });
    } else {
      toast.success("Palette imported");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Palette actions">
      <Button onClick={run}>
        <Shuffle /> Generate
        <Kbd className="border-transparent bg-primary-foreground/15 text-primary-foreground">Space</Kbd>
      </Button>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" onClick={undo} disabled={!canUndo} aria-label="Undo">
            <Undo2 />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Undo · Z</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="icon" onClick={redo} disabled={!canRedo} aria-label="Redo">
            <Redo2 />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Redo · ⇧Z</TooltipContent>
      </Tooltip>
      <Button
        variant="outline"
        onClick={() => addSwatch(randomColor(), selectedId ?? undefined)}
        disabled={swatches.length >= MAX_SWATCHES}
      >
        <Plus /> Add color
      </Button>
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Download /> Import
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import palette</DialogTitle>
            <DialogDescription>Paste a Coolors URL or text containing hex codes.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={importValue}
            onChange={(event) => setImportValue(event.target.value)}
            placeholder="https://coolors.co/264653-2a9d8f-e9c46a-f4a261-e76f51"
            aria-label="Palette import value"
            rows={5}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={importPalette}>Import</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Button variant="outline" onClick={save}>
        <Bookmark /> Save
      </Button>
      <p className="ml-auto hidden text-xs text-subtle-foreground md:block">
        Lock colors to keep them between generations.
      </p>
    </div>
  );
}
