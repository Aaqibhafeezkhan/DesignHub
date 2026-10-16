"use client";

import { useEffect } from "react";

import { useBrandHistory } from "@/hooks/use-brand-history";
import { useGoShortcuts } from "@/hooks/use-go-shortcuts";
import { isTypingTarget } from "@/hooks/use-hotkeys";
import { startBrandHistory } from "@/lib/brand/history-session";

/** Code editors (CodeMirror, Monaco) keep their own undo, so the brand history stays out of them. */
const EDITOR = "[role=textbox], .cm-editor, .monaco-editor";

function inEditor(target: EventTarget | null): boolean {
  return isTypingTarget(target) || (target instanceof Element && target.closest(EDITOR) !== null);
}

/** Cmd or Ctrl+Z undoes and Cmd or Ctrl+Shift+Z redoes brand edits, except inside text fields and editors. */
function useBrandHistoryShortcuts(): void {
  const { undo, redo } = useBrandHistory();

  // The history lives for the whole page load, so moving between layouts keeps it.
  useEffect(() => {
    startBrandHistory();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.key.toLowerCase() !== "z") return;
      if (inEditor(event.target)) return;
      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);
}

export function GlobalShortcuts() {
  useGoShortcuts();
  useBrandHistoryShortcuts();
  return null;
}
