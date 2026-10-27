import Link from "next/link";

import { cn } from "@/lib/utils";

function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("size-6", className)}>
      <rect width="24" height="24" rx="7" className="fill-foreground" />
      <path d="M7 6.5h4.2a5.5 5.5 0 0 1 0 11H7z" className="fill-background" />
      <circle cx="16.5" cy="7.5" r="2" className="fill-brand" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-2 rounded-md font-display text-[15px] font-semibold tracking-tight",
        className,
      )}
    >
      <LogoMark />
      <span>DesignHub</span>
    </Link>
  );
}
