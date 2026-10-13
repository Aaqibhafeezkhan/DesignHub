import type { Metadata } from "next";

import { BrandWorkspace } from "@/components/brand/brand-workspace";
import { Message } from "@/components/layout/message";
import { Workspace } from "@/components/layout/workspace";
import { PageHeader } from "@/components/ui/page-header";
import { getStudio } from "@/lib/navigation";

const studio = getStudio("brand");

export const metadata: Metadata = { title: "Brand Studio", description: studio.description };

export default function BrandPage() {
  return (
    <Workspace className="gap-6">
      <PageHeader
        eyebrow={<Message id="studio.eyebrow" />}
        title={<Message id="studio.brand.title" />}
        description={<Message id="studio.brand.description" />}
      />
      <BrandWorkspace />
    </Workspace>
  );
}
