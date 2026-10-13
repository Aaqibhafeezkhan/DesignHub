import { Code2, HardDrive, Keyboard, Moon, ShieldCheck, UserX, WifiOff, Zap, type LucideIcon } from "lucide-react";
import { Message } from "@/components/layout/message";
import type { PlainMessageKey } from "@/lib/i18n/translate";

const features = [
  { id: "openSource", icon: Code2, title: "home.feature.openSource.title", body: "home.feature.openSource.body" },
  { id: "localFirst", icon: HardDrive, title: "home.feature.localFirst.title", body: "home.feature.localFirst.body" },
  { id: "noLogin", icon: UserX, title: "home.feature.noLogin.title", body: "home.feature.noLogin.body" },
  { id: "noBackend", icon: ShieldCheck, title: "home.feature.noBackend.title", body: "home.feature.noBackend.body" },
  { id: "offline", icon: WifiOff, title: "home.feature.offline.title", body: "home.feature.offline.body" },
  { id: "keyboard", icon: Keyboard, title: "home.feature.keyboard.title", body: "home.feature.keyboard.body" },
  { id: "production", icon: Zap, title: "home.feature.production.title", body: "home.feature.production.body" },
  { id: "themes", icon: Moon, title: "home.feature.themes.title", body: "home.feature.themes.body" },
] as const satisfies { id: string; icon: LucideIcon; title: PlainMessageKey; body: PlainMessageKey }[];

export function Features() {
  return (
    <section aria-labelledby="features-title" className="border-y bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-16 md:py-24">
        <div className="flex max-w-2xl flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-subtle-foreground">
            <Message id="home.features.eyebrow" />
          </p>
          <h2 id="features-title" className="text-3xl font-medium md:text-4xl">
            <Message id="home.features.title" />
          </h2>
          <p className="text-muted-foreground">
            <Message id="home.features.body" />
          </p>
        </div>
        <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ id, icon: Icon, title, body }) => (
            <li key={id} className="flex flex-col gap-2">
              <span className="flex size-8 items-center justify-center rounded-md border bg-background">
                <Icon className="size-4 text-brand" aria-hidden />
              </span>
              <h3 className="pt-2 text-sm font-medium">
                <Message id={title} />
              </h3>
              <p className="text-sm text-muted-foreground">
                <Message id={body} />
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
