"use client";

import { GripVertical } from "lucide-react";
import { useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

import { useI18n } from "@/components/layout/locale-provider";
import { svgToDataUrl } from "@/lib/icons/svg";

type SvgComparisonProps = {
  original: string;
  optimized: string;
  width: number;
  height: number;
};

/** Disjoint clips preserve transparency without resizing either aligned drawing. */
export function SvgComparison({ original, optimized, width, height }: SvgComparisonProps) {
  const { t } = useI18n();
  const instructions = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const originalSrc = useMemo(() => svgToDataUrl(original), [original]);
  const optimizedSrc = useMemo(() => svgToDataUrl(optimized), [optimized]);

  function move(event: PointerEvent<HTMLDivElement>) {
    const bounds = ref.current?.getBoundingClientRect();
    if (bounds?.width)
      setPosition(Math.round(Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100))));
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 10 : 1;
    switch (event.key) {
      case "ArrowLeft":
      case "ArrowDown":
        setPosition((value) => Math.max(0, value - step));
        break;
      case "ArrowRight":
      case "ArrowUp":
        setPosition((value) => Math.min(100, value + step));
        break;
      case "Home":
        setPosition(0);
        break;
      case "End":
        setPosition(100);
        break;
      default:
        return;
    }
    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <div ref={ref} className="relative shrink-0" style={{ width, height }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- Untrusted SVG stays in an image data URL. */}
      <img
        src={optimizedSrc}
        alt={t("svg.compare.optimized")}
        draggable={false}
        className="block size-full max-w-none"
        style={{ clipPath: `inset(0 0 0 ${position}%)` }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- Untrusted SVG stays in an image data URL. */}
      <img
        src={originalSrc}
        alt={t("svg.compare.original")}
        draggable={false}
        className="absolute inset-0 size-full max-w-none"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 w-px bg-foreground"
        style={{ left: `${position}%` }}
      />
      <div
        role="slider"
        tabIndex={0}
        aria-label={t("svg.compare.divider")}
        aria-describedby={instructions}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={position}
        aria-valuetext={t("svg.compare.value", { original: position, optimized: 100 - position })}
        aria-orientation="horizontal"
        onKeyDown={onKeyDown}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.currentTarget.focus();
          event.currentTarget.setPointerCapture(event.pointerId);
          move(event);
          event.preventDefault();
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) move(event);
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        className="absolute top-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 touch-none cursor-ew-resize items-center justify-center rounded-lg border border-border-strong bg-card text-foreground shadow-sm outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        style={{ left: `clamp(22px, ${position}%, calc(100% - 22px))` }}
      >
        <GripVertical aria-hidden className="size-5" />
      </div>
      <span id={instructions} className="sr-only">
        {t("svg.compare.instructions")}
      </span>
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 flex justify-between gap-2 text-[11px]">
        <span className="rounded-sm bg-card px-1.5 py-1 text-foreground">{t("svg.compare.original")}</span>
        <span className="rounded-sm bg-card px-1.5 py-1 text-foreground">{t("svg.compare.optimized")}</span>
      </div>
    </div>
  );
}
