"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";

/**
 * A link to a studio. Next.js prefetches every link in view, so a page that links to every studio loaded data
 * for studios nobody opened. This one prefetches when the pointer arrives or the link gets keyboard focus, and
 * not before. Next.js drops repeated prefetches of the same route, so asking again is free.
 */
export function StudioLink({ onFocus, onPointerEnter, href, ...props }: ComponentProps<typeof Link>) {
  const router = useRouter();
  return (
    <Link
      {...props}
      href={href}
      prefetch={false}
      onPointerEnter={(event) => {
        if (typeof href === "string") router.prefetch(href);
        onPointerEnter?.(event);
      }}
      onFocus={(event) => {
        if (typeof href === "string") router.prefetch(href);
        onFocus?.(event);
      }}
    />
  );
}
