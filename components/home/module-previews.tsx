import { Bookmark, Camera, Heart, Layers, Mail, Search, Star, Zap } from "lucide-react";

/* Static, decorative previews for the homepage module cards. */

export function TypographyPreview() {
  return (
    <div className="flex h-full items-end justify-between gap-4">
      <span className="font-display text-7xl leading-none font-medium tracking-tight">Aa</span>
      <ul className="flex flex-col items-end gap-1 text-right text-xs text-muted-foreground">
        <li className="text-foreground">Space Grotesk</li>
        <li>Inter</li>
        <li>Fraunces</li>
        <li>JetBrains Mono</li>
      </ul>
    </div>
  );
}

const ramp = ["#eef2ff", "#c7d2fe", "#a5b4fc", "#818cf8", "#6366f1", "#4f46e5", "#4338ca", "#3730a3", "#312e81"];
const palette = ["#0f172a", "#6366f1", "#f472b6", "#ffc935", "#34d399"];

export function ColorPreview() {
  return (
    <div className="flex h-full flex-col justify-end gap-2">
      <div className="flex h-12 overflow-hidden rounded-md">
        {palette.map((color) => (
          <span key={color} className="flex-1" style={{ background: color }} />
        ))}
      </div>
      <div className="flex h-4 overflow-hidden rounded-sm">
        {ramp.map((color) => (
          <span key={color} className="flex-1" style={{ background: color }} />
        ))}
      </div>
    </div>
  );
}

const previewIcons = [Search, Heart, Star, Zap, Mail, Camera, Layers, Bookmark];

export function IconPreview() {
  return (
    <div className="grid h-full grid-cols-8 content-end gap-2">
      {previewIcons.map((Icon, index) => (
        <span
          key={index}
          className="flex aspect-square items-center justify-center rounded-md border bg-surface text-muted-foreground"
        >
          <Icon className="size-4" strokeWidth={1.5} />
        </span>
      ))}
    </div>
  );
}

export function ExportPreview() {
  return (
    <pre className="h-full overflow-hidden rounded-md border bg-surface p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
      <code>
        <span className="text-subtle-foreground">:root {"{"}</span>
        {"\n  "}
        <span className="text-brand">--color-primary</span>: oklch(0.62 0.19 275);
        {"\n  "}
        <span className="text-brand">--font-heading</span>: &quot;Space Grotesk&quot;;
        {"\n  "}
        <span className="text-brand">--text-xl</span>: clamp(1.25rem, 1.1rem + 0.6vw, 1.5rem);
        {"\n"}
        <span className="text-subtle-foreground">{"}"}</span>
      </code>
    </pre>
  );
}

export function BackgroundPreview() {
  return (
    <svg viewBox="0 0 400 144" className="h-full w-full rounded-md" preserveAspectRatio="none" aria-hidden>
      <rect width="400" height="144" fill="#0e0e10" />
      <path d="M0 80 C 80 40, 160 120, 240 70 S 360 50, 400 80 V144 H0Z" fill="#6366f1" opacity="0.8" />
      <path d="M0 104 C 90 70, 170 140, 260 96 S 360 84, 400 104 V144 H0Z" fill="#f472b6" opacity="0.8" />
      <path d="M0 124 C 100 100, 190 150, 280 118 S 370 110, 400 124 V144 H0Z" fill="#fbbf24" opacity="0.9" />
    </svg>
  );
}

export function EffectsPreview() {
  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden rounded-md bg-[linear-gradient(135deg,#6366f1,#ec4899_55%,#f59e0b)]">
      <div className="h-20 w-44 rounded-xl border border-white/30 bg-white/15 shadow-[0_8px_32px_rgb(0_0_0/0.25)] backdrop-blur-md" />
    </div>
  );
}

export function SvgPreview() {
  return (
    <pre className="h-full overflow-hidden rounded-md border bg-surface p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
      <code>
        <span className="text-subtle-foreground">&lt;svg viewBox=&quot;0 0 24 24&quot;&gt;</span>
        {"\n  "}
        <span className="text-brand">&lt;path</span> d=&quot;M4 12l5 5L20 6&quot;{" "}
        <span className="text-brand">/&gt;</span>
        {"\n"}
        <span className="text-subtle-foreground">&lt;/svg&gt;</span>
        {"\n\n"}
        <span className="text-success">−62% · optimized</span>
      </code>
    </pre>
  );
}

export function AccessibilityPreview() {
  return (
    <div className="flex h-full flex-col justify-end gap-2">
      {[
        ["Contrast 7.1:1", "AAA", "text-success"],
        ["Line height 1.5", "Pass", "text-success"],
        ["Target 32×32", "Too small", "text-warning"],
      ].map(([label, verdict, tone]) => (
        <div key={label} className="flex items-center justify-between rounded-md border bg-surface px-3 py-2 text-xs">
          <span className="text-muted-foreground">{label}</span>
          <span className={`font-medium ${tone}`}>{verdict}</span>
        </div>
      ))}
    </div>
  );
}
