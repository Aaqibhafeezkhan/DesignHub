"use client";

import { useEffect } from "react";

import { saveActiveProject } from "@/lib/projects/actions";
import { flushFolderSync, initFolderSync } from "@/lib/projects/folder-sync";
import { subscribeToSnapshot } from "@/lib/projects/snapshot";

const DELAY = 800;

/** Keeps the open project in sync with edits made in any studio. Renders nothing. */
export function ProjectAutosave() {
  useEffect(() => {
    // Reconnects the saved folder (if any) so edits are written to it on every page, not only Brand Projects.
    void initFolderSync();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const flush = () => {
      clearTimeout(timer);
      timer = undefined;
      void saveActiveProject();
    };
    const unsubscribe = subscribeToSnapshot(() => {
      clearTimeout(timer);
      timer = setTimeout(flush, DELAY);
    });
    const onHide = () => {
      if (document.visibilityState !== "hidden") return;
      if (timer) flush();
      flushFolderSync();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", onHide);
      if (timer) flush();
    };
  }, []);
  return null;
}
