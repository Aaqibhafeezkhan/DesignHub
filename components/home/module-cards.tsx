import { StudioLink as Link } from "@/components/layout/studio-link";

import { Message } from "@/components/layout/message";
import { studios } from "@/lib/navigation";

/** Every studio, folded: the full list is one click away, and nothing is hidden for good. */
export function ModuleCards() {
  return (
    <section aria-labelledby="modules-title" className="mx-auto max-w-6xl px-4 pb-16 md:pb-24">
      <details className="group rounded-xl border bg-card">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-base font-medium [&::-webkit-details-marker]:hidden">
          <span id="modules-title">
            <Message id="home.allStudios" values={{ count: studios.length }} />
          </span>
          <span aria-hidden className="text-subtle-foreground transition-transform duration-150 group-open:rotate-180">
            ⌄
          </span>
        </summary>
        <ul className="grid grid-cols-1 gap-x-8 gap-y-1 border-t p-3 sm:grid-cols-2">
          {studios.map((studio) => {
            const Icon = studio.icon;
            return (
              <li key={studio.id}>
                <Link
                  href={studio.href}
                  className="flex items-start gap-3 rounded-md p-2 transition-colors duration-150 hover:bg-accent"
                >
                  <Icon className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                  <span className="flex flex-col">
                    <span className="text-sm font-medium">
                      <Message id={`studio.${studio.id}.title`} />
                    </span>
                    <span className="text-xs text-muted-foreground">
                      <Message id={`studio.${studio.id}.description`} />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </details>
    </section>
  );
}
