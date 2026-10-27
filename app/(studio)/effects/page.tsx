import type { Metadata } from "next";

import { EffectsWorkspace } from "@/components/effects/effects-workspace";
import { Workspace } from "@/components/layout/workspace";
import { ModeSwitch } from "@/components/layout/mode-switch";
import { PageHeader } from "@/components/ui/page-header";
import { getStudio } from "@/lib/navigation";

const studio = getStudio("effects");

export const metadata: Metadata = { title: "Effects Lab", description: studio.description };

export default function EffectsPage() {
  return (
    <Workspace className="gap-6">
      <PageHeader eyebrow="Studio" title={studio.title} description={studio.description} actions={<ModeSwitch />} />
      <EffectsWorkspace />
    </Workspace>
  );
}
