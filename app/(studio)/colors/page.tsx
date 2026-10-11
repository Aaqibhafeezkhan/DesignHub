import type { Metadata } from "next";

import { ColorWorkspace } from "@/components/colors/color-workspace";
import { Message } from "@/components/layout/message";
import { Workspace } from "@/components/layout/workspace";
import { PageHeader } from "@/components/ui/page-header";
import { getStudio } from "@/lib/navigation";

const studio = getStudio("colors");

export const metadata: Metadata = { title: "Color Studio", description: studio.description };

export default function ColorsPage() {
  return (
    <Workspace>
      <PageHeader
        eyebrow={<Message id="studio.eyebrow" />}
        title={<Message id="studio.colors.title" />}
        description={<Message id="studio.colors.description" />}
      />
      <ColorWorkspace />
    </Workspace>
  );
}
