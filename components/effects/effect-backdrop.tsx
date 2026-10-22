import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { EffectBackdrop as Backdrop } from "@/types/effects";

/** Shared photo backdrop for Effects Lab previews (glass, duotone before/after). */
export const EFFECT_PHOTO_DATA_URL = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="#1e1b4b"/><circle cx="180" cy="160" r="170" fill="#f472b6"/><circle cx="620" cy="200" r="150" fill="#fbbf24"/><circle cx="420" cy="480" r="200" fill="#6366f1"/><circle cx="700" cy="560" r="110" fill="#34d399"/></svg>',
)}`;

const photo = `url("${EFFECT_PHOTO_DATA_URL}")`;

const backdrops: Record<Backdrop, { className: string; style?: React.CSSProperties }> = {
  gradient: { className: "bg-[linear-gradient(135deg,#6366f1,#ec4899_55%,#f59e0b)]" },
  photo: { className: "bg-cover bg-center", style: { backgroundImage: photo } },
  light: { className: "bg-[#e0e5ec]" },
  dark: { className: "bg-[#0e0e10]" },
};

/** The surface effects are previewed on. Busy backdrops make blur and glass legible. */
export function EffectBackdrop({
  backdrop,
  surface,
  children,
}: {
  backdrop: Backdrop;
  /** Overrides the backdrop with a flat color (for effects that need a matching surface). */
  surface?: string;
  children: ReactNode;
}) {
  const config = backdrops[backdrop];
  return (
    <div
      className={cn(
        "relative flex min-h-[420px] flex-1 items-center justify-center overflow-hidden rounded-lg border p-10",
        !surface && config.className,
      )}
      style={surface ? { background: surface } : config.style}
    >
      {children}
    </div>
  );
}
