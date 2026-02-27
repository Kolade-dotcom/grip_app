import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface PillProps {
  children: ReactNode;
  color?: string;
  bg?: string;
  className?: string;
}

export function Pill({ children, color, bg, className }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-[9px] py-[3px] rounded-pill text-[11px] font-semibold tracking-[0.01em] leading-none whitespace-nowrap",
        className
      )}
      style={{ color, background: bg }}
    >
      {children}
    </span>
  );
}
