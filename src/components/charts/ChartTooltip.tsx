"use client";

import type { TooltipProps } from "recharts";
import { getBgColor, getTextColor } from "./chartTheme";

type ChartTooltipProps = TooltipProps<number, string> & {
  isDark: boolean;
};

export function ChartTooltip({ active, payload, label, isDark }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="card-base rounded-[8px] px-3 py-2 shadow-lg"
      style={{ background: getBgColor(isDark) }}
    >
      <p className="text-[11px] font-medium mb-1" style={{ color: getTextColor(isDark) }}>
        {label}
      </p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-[12px]">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: entry.color }}
          />
          <span className="text-text-secondary capitalize">{entry.name}:</span>
          <span className="font-semibold text-text-primary">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}
