"use client";

import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";

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
  onClick,
}: PlaybookCardProps) {
  const successRate =
    totalCompletions > 0
      ? Math.round((successfulOutcomes / totalCompletions) * 100)
      : 0;
  const completionRate =
    totalEnrollments > 0
      ? Math.round((totalCompletions / totalEnrollments) * 100)
      : 0;

  return (
    <Card
      className="cursor-pointer hover:border-accent/30 transition-all duration-150"
      onClick={() => onClick(id)}
    >
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl">{emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-sm font-bold text-text-primary truncate">
              {name}
            </h3>
            {!active && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-pill bg-surface-input text-text-muted">
                Paused
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-text-muted mb-2.5">
        <span>{stepCount} steps</span>
        <span>{totalEnrollments} enrolled</span>
        <span>{totalCompletions > 0 ? `${successRate}% success` : "—"}</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-label text-text-muted">Completion</span>
            <span className="text-label text-text-muted">{completionRate}%</span>
          </div>
          <ProgressBar value={completionRate} color="bg-accent" />
        </div>
      </div>
    </Card>
  );
}
