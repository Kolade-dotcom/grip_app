"use client";

import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types/risk";

export type FilterKey = "all" | RiskLevel;

interface FilterDef {
  key: FilterKey;
  label: string;
  color?: string;
}

interface MemberFiltersProps {
  activeFilter: FilterKey;
  onFilterChange: (key: FilterKey) => void;
  counts: Record<FilterKey, number>;
}

export function MemberFilters({ activeFilter, onFilterChange, counts }: MemberFiltersProps) {
  const filters: FilterDef[] = [
    { key: "all", label: "All" },
    { key: "critical", label: "Critical", color: "#ff4757" },
    { key: "high", label: "High", color: "#ffa502" },
    { key: "medium", label: "Medium" },
    { key: "low", label: "Low" },
  ];

  return (
    <div className="flex gap-1 flex-wrap">
      {filters.map((f) => {
        const isActive = activeFilter === f.key;
        return (
          <button
            key={f.key}
            onClick={() => onFilterChange(f.key)}
            className={cn(
              "px-3 py-[5px] rounded-[7px] border-none cursor-pointer text-[11px] font-semibold font-body transition-all duration-150",
            )}
            style={{
              background: isActive
                ? f.color
                  ? `${f.color}18`
                  : "rgba(110,86,255,0.14)"
                : "transparent",
              color: isActive
                ? f.color || "#b4a4ff"
                : "var(--text-muted)",
            }}
          >
            {f.label} ({counts[f.key]})
          </button>
        );
      })}
    </div>
  );
}
