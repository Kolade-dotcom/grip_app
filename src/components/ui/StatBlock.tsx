import { type ReactNode } from "react";

interface StatBlockProps {
  label: string;
  value: ReactNode;
  sub?: string;
  accentColor?: string;
}

export function StatBlock({ label, value, sub, accentColor }: StatBlockProps) {
  return (
    <div className="card-base px-[18px] py-4 flex-1 min-w-0">
      <div className="text-label mb-2">{label}</div>
      <div
        className="stat-number text-2xl leading-none"
        style={accentColor ? { color: accentColor } : undefined}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[11px] text-text-secondary mt-1.5 leading-snug">
          {sub}
        </div>
      )}
    </div>
  );
}
