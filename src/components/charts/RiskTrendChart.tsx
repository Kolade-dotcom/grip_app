"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CHART_COLORS, getGridColor, getTextColor } from "./chartTheme";
import { ChartTooltip } from "./ChartTooltip";

type RiskTrendDataPoint = {
  date: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
};

type RiskTrendChartProps = {
  data: RiskTrendDataPoint[];
  isDark: boolean;
  period: 7 | 30 | 90;
  onPeriodChange: (period: 7 | 30 | 90) => void;
};

const PERIODS: (7 | 30 | 90)[] = [7, 30, 90];

export function RiskTrendChart({ data, isDark, period, onPeriodChange }: RiskTrendChartProps) {
  const textColor = getTextColor(isDark);
  const gridColor = getGridColor(isDark);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading text-[13px] font-bold text-text-primary">
          Risk Trend
        </h3>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={`px-2 py-0.5 text-[11px] font-medium rounded-[6px] transition-colors ${
                period === p
                  ? "bg-accent/15 text-accent"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {p}d
            </button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-[220px] flex items-center justify-center text-sm text-text-muted">
          No trend data yet. Snapshots are taken every 6 hours.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: textColor }}
              tickLine={false}
              axisLine={{ stroke: gridColor }}
            />
            <YAxis
              tick={{ fontSize: 10, fill: textColor }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<ChartTooltip isDark={isDark} />} />
            <Area
              type="monotone"
              dataKey="low"
              stackId="1"
              stroke={CHART_COLORS.low}
              fill={CHART_COLORS.low}
              fillOpacity={0.3}
            />
            <Area
              type="monotone"
              dataKey="medium"
              stackId="1"
              stroke={CHART_COLORS.medium}
              fill={CHART_COLORS.medium}
              fillOpacity={0.3}
            />
            <Area
              type="monotone"
              dataKey="high"
              stackId="1"
              stroke={CHART_COLORS.high}
              fill={CHART_COLORS.high}
              fillOpacity={0.3}
            />
            <Area
              type="monotone"
              dataKey="critical"
              stackId="1"
              stroke={CHART_COLORS.critical}
              fill={CHART_COLORS.critical}
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
