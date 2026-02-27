import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types/risk";

interface RiskPillProps {
  level: RiskLevel;
}

const levelClasses: Record<RiskLevel, string> = {
  critical: "bg-risk-critical-bg text-risk-critical",
  high: "bg-risk-high-bg text-risk-high",
  medium: "bg-risk-medium-bg text-risk-medium",
  low: "bg-risk-low-bg text-risk-low",
};

export function RiskPill({ level }: RiskPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-[9px] py-[3px] rounded-pill text-[11px] font-semibold tracking-[0.01em] leading-none whitespace-nowrap",
        levelClasses[level]
      )}
    >
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
}
