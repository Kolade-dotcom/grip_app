"use client";

import { Card } from "@/components/ui/Card";

type PlaybookCardProps = {
  id: string;
  name: string;
  emoji: string;
  description: string | null;
  active: boolean;
  totalEnrollments: number;
  totalCompletions: number;
  successfulOutcomes: number;
  stepCount: number;
  steps?: { step_number: number; type: string; subject?: string }[];
  idx?: number;
  onClick: (id: string) => void;
};

export function PlaybookCard({
  id,
  name,
  emoji,
  description,
  active,
  totalEnrollments,
  totalCompletions,
  successfulOutcomes,
  stepCount,
  steps,
  idx = 0,
  onClick,
}: PlaybookCardProps) {
  const successRate =
    totalCompletions > 0
      ? Math.round((successfulOutcomes / totalCompletions) * 100)
      : 0;

  const funnelSteps = steps ?? Array.from({ length: stepCount }, (_, i) => ({
    step_number: i + 1,
    type: "email" as const,
    subject: `Step ${i + 1}`,
  }));

  return (
    <Card
      hover
      className="cursor-pointer hover:border-accent/30"
      style={{ animation: `fadeSlideIn 0.3s ease ${idx * 0.05}s both` }}
      onClick={() => onClick(id)}
    >
      <div className="flex justify-between items-start mb-3.5 flex-wrap gap-2">
        <div className="flex gap-2.5 items-center">
          <span className="text-[22px]">{emoji}</span>
          <div>
            <span className="text-sm font-bold text-text-primary font-heading">
              {name}
            </span>
            {description && (
              <p className="text-[11px] text-text-muted mt-0.5 line-clamp-1">{description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-1.5 items-center">
          {active ? (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-pill bg-risk-low/10 text-risk-low">
              Active
            </span>
          ) : (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-pill bg-surface-input text-text-muted">
              Paused
            </span>
          )}
          <span className="text-xs text-text-secondary">{totalEnrollments} enrolled</span>
        </div>
      </div>

      <div className="flex gap-[3px] mb-3">
        {funnelSteps.map((step, i) => {
          const pct = totalEnrollments > 0 ? Math.max(0.1, 1 - i * 0.2) : 0;
          return (
            <div key={step.step_number} className="flex-1">
              <div className="h-[5px] bg-surface-input rounded-[3px] overflow-hidden">
                <div
                  className="h-full bg-accent rounded-[3px] transition-[width] duration-500"
                  style={{ width: `${pct * 100}%` }}
                />
              </div>
              <p className="text-[9px] text-text-muted mt-[3px] text-center truncate">
                {step.subject ?? step.type}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center">
        <span className="text-[11px] text-text-muted">
          {stepCount} steps
        </span>
        <div className="flex items-center gap-1">
          <span className="text-xl font-extrabold text-accent font-heading tracking-tight">
            {totalCompletions > 0 ? `${successRate}%` : "—"}
          </span>
          <span className="text-[11px] text-text-muted">success</span>
        </div>
      </div>
    </Card>
  );
}
