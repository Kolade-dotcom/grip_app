"use client";

import { ProgressBar } from "@/components/ui/ProgressBar";

type Step = {
  step_number: number;
  type: string;
  template_id?: string;
  subject?: string;
};

type StepFunnelProps = {
  steps: Step[];
  enrollments: number;
  isMobile: boolean;
};

export function StepFunnel({ steps, enrollments, isMobile }: StepFunnelProps) {
  return (
    <div className="flex flex-col gap-2.5">
      {steps.map((step, i) => {
        const pct = enrollments > 0 ? Math.max(10, 100 - i * 20) : 0;
        const label =
          step.type === "wait"
            ? "Wait"
            : step.type === "check_status"
              ? "Check Status"
              : step.subject ?? step.template_id ?? `Step ${step.step_number}`;

        return (
          <div key={step.step_number} className="flex items-center gap-2.5">
            <span
              className="shrink-0 w-6 h-6 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center"
            >
              {step.step_number}
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-text-primary">
                  {label}
                </span>
                <span className="text-xs text-text-muted">
                  {step.type === "email" ? "Email" : step.type === "wait" ? "Delay" : "Check"}
                </span>
              </div>
              {step.type === "email" && (
                <ProgressBar value={pct} color="bg-accent" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
