import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Message } from "@/components/layout/message";
import { homeGoals } from "@/lib/home-goals";
import { getStudio } from "@/lib/navigation";

/** A short "what do you want to make?" with one link per goal, in place of a card for every studio. */
export function StudioChooser() {
  return (
    <section aria-labelledby="chooser-title" className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 md:py-24">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-subtle-foreground">
          <Message id="home.chooser.eyebrow" />
        </p>
        <h2 id="chooser-title" className="text-3xl font-medium md:text-4xl">
          <Message id="home.chooser.title" />
        </h2>
      </div>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {homeGoals.map((goal) => {
          const studio = getStudio(goal.studio);
          const Icon = studio.icon;
          return (
            <li key={goal.id}>
              <Link
                href={studio.href}
                className="group flex h-full flex-col gap-3 rounded-xl border bg-card p-5 transition-[border-color,background-color] duration-200 hover:border-border-strong hover:bg-surface-raised focus-visible:border-ring"
              >
                <span className="flex items-center justify-between gap-3">
                  <Icon className="size-5 text-brand" aria-hidden />
                  <ArrowUpRight
                    className="size-4 text-subtle-foreground transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
                    aria-hidden
                  />
                </span>
                <span className="text-base font-medium">
                  <Message id={`home.goal.${goal.id}.title`} />
                </span>
                <span className="text-sm text-muted-foreground">
                  <Message id={`home.goal.${goal.id}.body`} />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
