"use client";

import { Check, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import type { MotionSection } from "@/lib/a11y/motion";
import { cn } from "@/lib/utils";

/** Which animated effects from the Effects Lab have a reduced-motion rule in their exported CSS. */
export function MotionResults({ section }: { section: MotionSection }) {
  return (
    <Panel
      title="Motion"
      description="Reads the CSS each Effects Lab effect exports. Anything that animates or moves needs a prefers-reduced-motion rule."
    >
      {section.checks.length ? (
        <ul className="flex flex-col gap-2" aria-label="Effects that move">
          {section.checks.map((row) => (
            <li
              key={row.check}
              className={cn(
                "flex items-start justify-between gap-3 rounded-md border p-3",
                row.pass ? "border-success/30" : "border-destructive/40",
              )}
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-medium">{row.check}</span>
                <span className="text-xs text-muted-foreground">{row.motion}</span>
                <span className="text-xs text-muted-foreground">
                  {row.reducedMotionRule
                    ? "Has a prefers-reduced-motion rule."
                    : "No prefers-reduced-motion rule in its CSS."}
                </span>
              </div>
              <Badge variant={row.pass ? "success" : "destructive"}>
                {row.pass ? <Check aria-hidden /> : <X aria-hidden />}
                {row.pass ? "Pass" : "Fail"}
              </Badge>
            </li>
          ))}
        </ul>
      ) : (
        <p role="status" className="text-xs text-muted-foreground">
          No effect moves with the current Effects Lab settings.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Turn on an animation in the Effects Lab (an animated border or a gradient text shift) to see it checked here.
      </p>
    </Panel>
  );
}
