"use client";

interface EngagementChartProps {
  data: { label: string; value: number }[];
}

export function EngagementChart({ data }: EngagementChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-[3px] h-[52px]">
      {data.map((d, i) => (
        <div
          key={i}
          className="flex-1 flex flex-col items-center gap-[3px]"
        >
          <div
            className="w-full max-w-[22px] rounded-[3px] transition-[height] duration-400 ease-out"
            style={{
              height: `${Math.max((d.value / max) * 44, 2)}px`,
              background:
                i >= data.length - 2
                  ? "#6e56ff"
                  : i >= data.length - 4
                    ? "rgba(110,86,255,0.14)"
                    : "rgba(110,86,255,0.08)",
            }}
          />
          <span className="text-[8px] text-text-muted">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
