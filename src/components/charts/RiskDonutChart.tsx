"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { CHART_COLORS } from "./chartTheme";

type RiskDonutChartProps = {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
  isDark: boolean;
};

const LEVELS = ["critical", "high", "medium", "low"] as const;

export function RiskDonutChart({ critical, high, medium, low, total, isDark }: RiskDonutChartProps) {
  const data = [
    { name: "Critical", value: critical },
    { name: "High", value: high },
    { name: "Medium", value: medium },
    { name: "Low", value: low },
  ].filter((d) => d.value > 0);

  if (total === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-sm text-text-muted">
        No risk data yet.
      </div>
    );
  }

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="80%"
            dataKey="value"
            stroke="none"
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={CHART_COLORS[entry.name.toLowerCase() as typeof LEVELS[number]]}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <span className="font-heading text-2xl font-extrabold text-text-primary block leading-none">
            {total}
          </span>
          <span className="text-[10px] text-text-muted">members</span>
        </div>
      </div>
    </div>
  );
}
