"use client";

import { ChevronDown } from "lucide-react";
import * as React from "react";

import { useIsAdvanced } from "@/components/ui/advanced";
import { isPanelOpen } from "@/lib/panel-state";
import { cn } from "@/lib/utils";
import { usePanelStore } from "@/store/panel-store";

type PanelProps = React.ComponentProps<"section"> & {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  /** The panel folds. It needs an `id` and a `title`, and its state is remembered by that id. */
  collapsible?: boolean;
  /** Open until the person chooses otherwise. Advanced panels start folded. */
  defaultOpen?: boolean;
  /** Only Advanced mode shows the panel. Hiding it never changes a value. */
  advanced?: boolean;
};

/** A titled surface used to group controls inside a studio workspace. */
function Panel({
  title,
  description,
  actions,
  className,
  children,
  collapsible = false,
  defaultOpen = true,
  advanced = false,
  ...props
}: PanelProps) {
  const isAdvanced = useIsAdvanced();
  const headingId = React.useId();
  const bodyId = React.useId();
  const panelId = props.id;
  const foldable = collapsible && Boolean(title) && Boolean(panelId);
  const chosen = usePanelStore((state) => (panelId ? state.open[panelId] : undefined));
  const setOpen = usePanelStore((state) => state.setOpen);
  const open = isPanelOpen(foldable, chosen, defaultOpen);
  if (advanced && !isAdvanced) return null;

  const heading = foldable ? (
    <h2 id={headingId} className="text-sm font-medium">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen(panelId!, !open)}
        className="flex items-center gap-1.5 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronDown className={cn("size-3.5 transition-transform duration-150", !open && "-rotate-90")} aria-hidden />
        {title}
      </button>
    </h2>
  ) : title ? (
    <h2 id={headingId} className="text-sm font-medium">
      {title}
    </h2>
  ) : null;

  return (
    <section
      aria-labelledby={title ? headingId : undefined}
      className={cn("flex flex-col gap-4 rounded-lg border bg-card p-4", className)}
      {...props}
    >
      {title || actions ? (
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            {heading}
            {description && open ? <p className="text-xs text-muted-foreground">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
        </div>
      ) : null}
      {foldable ? (
        <div id={bodyId} hidden={!open} className="flex flex-col gap-4">
          {open ? children : null}
        </div>
      ) : (
        children
      )}
    </section>
  );
}

export { Panel };
