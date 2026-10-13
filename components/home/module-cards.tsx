import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import {
  AccessibilityPreview,
  BackgroundPreview,
  ColorPreview,
  EffectsPreview,
  ExportPreview,
  IconPreview,
  SvgPreview,
  TypographyPreview,
} from "@/components/home/module-previews";
import { Message } from "@/components/layout/message";
import type { PlainMessageKey } from "@/lib/i18n/translate";
import { studios, type StudioId } from "@/lib/navigation";

const previews: Partial<Record<StudioId, ReactNode>> = {
  typography: <TypographyPreview />,
  colors: <ColorPreview />,
  icons: <IconPreview />,
  backgrounds: <BackgroundPreview />,
  effects: <EffectsPreview />,
  svg: <SvgPreview />,
  accessibility: <AccessibilityPreview />,
  export: <ExportPreview />,
};

/** A highlight is a catalog key, or a format and product name that reads the same in every language. */
type Highlight = PlainMessageKey | { name: string };

const highlights: Partial<Record<StudioId, Highlight[]>> = {
  typography: [{ name: "Google Fonts" }, "home.hl.pairing", "home.hl.fluidScale", { name: "OpenType" }],
  colors: [{ name: "OKLCH" }, "home.hl.harmonies", "home.hl.shades", { name: "WCAG" }],
  icons: [{ name: "Iconify" }, "home.hl.restyle", { name: "SVG · React · PNG" }, "home.hl.favicons"],
  backgrounds: ["home.hl.generators", "home.hl.seeded", { name: "SVG · PNG · CSS" }, "home.hl.paletteAware"],
  effects: ["home.hl.glass", "home.hl.neumorphism", "home.hl.shadows", { name: "CSS · Tailwind" }],
  svg: ["home.hl.optimize", "home.hl.inspect", { name: "JSX · React Native" }, "home.hl.sprites"],
  accessibility: [{ name: "WCAG" }, "home.hl.colorVision", "home.hl.readability", "home.hl.touchTargets"],
  export: [{ name: "CSS" }, { name: "SCSS" }, { name: "Tailwind" }, "home.hl.jsonTokens"],
};

function GenericPreview({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div className="flex h-full items-center justify-center rounded-md border bg-surface">
      <Icon className="size-10 text-subtle-foreground" strokeWidth={1.25} aria-hidden />
    </div>
  );
}

export function ModuleCards() {
  return (
    <section aria-labelledby="modules-title" className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 md:py-24">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-subtle-foreground">
          <Message id="home.modules.eyebrow" values={{ count: studios.length }} />
        </p>
        <h2 id="modules-title" className="text-3xl font-medium md:text-4xl">
          <Message id="home.modules.title" />
        </h2>
      </div>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {studios.map((studio) => {
          const Icon = studio.icon;
          return (
            <li key={studio.id}>
              <Link
                href={studio.href}
                className="group flex h-full flex-col gap-6 rounded-xl border bg-card p-6 transition-[border-color,background-color] duration-200 hover:border-border-strong hover:bg-surface-raised focus-visible:border-ring"
              >
                <div className="h-36">{previews[studio.id] ?? <GenericPreview icon={Icon} />}</div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="flex items-center gap-2 text-lg font-medium">
                      <Icon className="size-4 text-brand" aria-hidden />
                      <Message id={`studio.${studio.id}.title`} />
                    </h3>
                    <ArrowUpRight
                      className="size-4 text-subtle-foreground transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
                      aria-hidden
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <Message id={`studio.${studio.id}.description`} />
                  </p>
                  <ul className="flex flex-wrap gap-1.5 pt-2">
                    {(highlights[studio.id] ?? []).map((item) => {
                      const id = typeof item === "string" ? item : item.name;
                      return (
                        <li key={id} className="rounded-sm border px-1.5 py-0.5 text-[11px] text-muted-foreground">
                          {typeof item === "string" ? <Message id={item} /> : item.name}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
