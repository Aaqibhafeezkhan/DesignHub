import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { LazyFileLaunchImport, LazyProjectAutosave, LazyShareLinkImport } from "@/components/projects/lazy-autosave";

export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell withSidebar>
      <LazyProjectAutosave />
      <LazyShareLinkImport />
      <LazyFileLaunchImport />
      {children}
    </AppShell>
  );
}
