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

export function StepFunnel({ steps, enrollments }: StepFunnelProps) {
  return (
    <div className="flex flex-col">
      {steps.map((step, i) => {
        const pct = enrollments > 0 ? Math.max(10, 100 - i * 20) : 0;
        const label =
          step.type === "wait"
            ? "Wait"
            : step.type === "check_status"
              ? "Check Status"
              : step.subject ?? step.template_id ?? `Step ${step.step_number}`;
        const sent = enrollments > 0 ? Math.max(0, Math.round(enrollments * (pct / 100))) : 0;

        return (
          <div key={step.step_number}>
            <div className="flex items-center gap-3 py-2.5">
              <div
                className="shrink-0 w-7 h-7 rounded-[7px] bg-accent/10 flex items-center justify-center text-xs font-extrabold text-accent-text font-heading"
              >
                {step.step_number}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-text-primary block mb-1.5">
                  {label}
                </span>
                <ProgressBar value={pct} color="bg-accent" height={6} />
              </div>
              <div className="text-right min-w-[50px]">
                <span className="text-base font-extrabold text-text-primary font-heading block leading-none">
                  {sent}
                </span>
                <span className="text-[10px] text-text-muted">sent</span>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className="ml-3.5 w-px h-2 bg-border" />
            )}
          </div>
        );
      })}
    </div>
  );
}
