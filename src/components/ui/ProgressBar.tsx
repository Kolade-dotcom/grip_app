interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  height?: number;
}

export function ProgressBar({ value, max = 100, color, height = 5 }: ProgressBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  const isTailwindClass = color?.startsWith("bg-");

  return (
    <div
      className="w-full bg-surface-input rounded-full"
      style={{ height }}
    >
      <div
        className={`h-full rounded-full transition-[width] duration-500 ease-out ${isTailwindClass ? color : ""}`}
        style={{
          width: `${pct}%`,
          ...(!isTailwindClass ? { background: color || "var(--accent, #6e56ff)" } : {}),
          height,
        }}
      />
    </div>
  );
}
