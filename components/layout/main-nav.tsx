"use client";

import { ChevronDown } from "lucide-react";
import { StudioLink as Link } from "@/components/layout/studio-link";
import { usePathname } from "next/navigation";
import { DropdownMenu } from "radix-ui";

import { useI18n } from "@/components/layout/locale-provider";
import { isActivePath, studios } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/** Links shown in the header. Below xl the ones from this index on move into the More menu. */
const HEADER_LINKS = 6;
const VISIBLE_BELOW_XL = 4;

const linkClass =
  "rounded-md px-2.5 py-1.5 text-sm whitespace-nowrap text-muted-foreground transition-colors duration-150 hover:text-foreground";

export function MainNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const links = studios.filter((studio) => studio.group !== "Tools").slice(0, HEADER_LINKS);
  const overflow = links.slice(VISIBLE_BELOW_XL);
  const overflowActive = overflow.some((studio) => isActivePath(pathname, studio.href));

  return (
    <nav aria-label={t("nav.main")} className={cn("hidden items-center gap-1 lg:flex", className)}>
      {links.map((studio, index) => {
        const active = isActivePath(pathname, studio.href);
        return (
          <Link
            key={studio.id}
            href={studio.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              linkClass,
              // Below xl the header can't fit six labels next to search, language and theme in every language.
              index >= VISIBLE_BELOW_XL && "max-xl:hidden",
              active && "text-foreground",
            )}
          >
            {t(`studio.${studio.id}.short`)}
          </Link>
        );
      })}
      {overflow.length ? (
        <DropdownMenu.Root modal={false}>
          <DropdownMenu.Trigger
            className={cn(
              linkClass,
              "inline-flex items-center gap-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 data-[state=open]:text-foreground xl:hidden",
              overflowActive && "text-foreground",
            )}
          >
            {t("nav.more")}
            <ChevronDown aria-hidden="true" className="size-3.5" />
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={6}
              className="z-50 min-w-44 rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg outline-none animate-in fade-in-0 zoom-in-95 duration-150"
            >
              {overflow.map((studio) => {
                const active = isActivePath(pathname, studio.href);
                return (
                  <DropdownMenu.Item key={studio.id} asChild>
                    <Link
                      href={studio.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex w-full cursor-pointer items-center rounded-md px-2.5 py-1.5 text-sm whitespace-nowrap text-muted-foreground outline-none data-[highlighted]:bg-accent data-[highlighted]:text-foreground",
                        active && "font-medium text-foreground",
                      )}
                    >
                      {t(`studio.${studio.id}.short`)}
                    </Link>
                  </DropdownMenu.Item>
                );
              })}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      ) : null}
    </nav>
  );
}
