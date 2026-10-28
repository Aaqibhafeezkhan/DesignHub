"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type MouseEvent } from "react";

import { Message } from "@/components/layout/message";
import { paneOfId, STUDIO_OUTPUT_ID, STUDIO_PANE_EVENT, STUDIO_PREVIEW_ID } from "@/lib/studio-panes";

const linkClass =
  "sr-only z-[60] rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3";

/**
 * Moves focus into the pane (`href` is `#id`), then scrolls it into view. On a phone the pane may be
 * hidden, so the studio is asked to show it first and focus moves once it has.
 */
function focusPane(event: MouseEvent<HTMLAnchorElement>) {
  const id = event.currentTarget.hash.slice(1);
  const target = document.getElementById(id);
  if (!target) return;
  event.preventDefault();
  const pane = paneOfId(id);
  if (pane) window.dispatchEvent(new CustomEvent(STUDIO_PANE_EVENT, { detail: pane }));
  requestAnimationFrame(() => {
    target.focus();
    target.scrollIntoView({ block: "nearest" });
  });
}

/**
 * The first Tab stops: skip to the main content and, on a studio page, straight to the preview
 * and the code and exports pane. The pane links appear only while the page has those panes.
 */
export function SkipLink() {
  const pathname = usePathname();
  const [panes, setPanes] = useState({ preview: false, output: false });

  useEffect(() => {
    // The studio mounts with the route, so look after it has rendered.
    const frame = requestAnimationFrame(() =>
      setPanes({
        preview: Boolean(document.getElementById(STUDIO_PREVIEW_ID)),
        output: Boolean(document.getElementById(STUDIO_OUTPUT_ID)),
      }),
    );
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <>
      <a href="#main" className={linkClass}>
        <Message id="nav.skip" />
      </a>
      {panes.preview ? (
        <a href={`#${STUDIO_PREVIEW_ID}`} className={linkClass} onClick={focusPane}>
          <Message id="nav.skipPreview" />
        </a>
      ) : null}
      {panes.output ? (
        <a href={`#${STUDIO_OUTPUT_ID}`} className={linkClass} onClick={focusPane}>
          <Message id="nav.skipOutput" />
        </a>
      ) : null}
    </>
  );
}
