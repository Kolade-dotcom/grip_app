"use client";

import { useState, useEffect } from "react";
import { StatBlock } from "@/components/ui/StatBlock";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StepFunnel } from "./StepFunnel";
import { timeAgo } from "@/lib/utils";

type PlaybookDetailProps = {
  playbookId: string;
  onBack: () => void;
  isMobile: boolean;
};

type PlaybookData = {
  id: string;
  name: string;
  emoji: string;
  description: string | null;
  active: boolean;
  steps: { step_number: number; type: string; template_id?: string; subject?: string }[];
  total_enrollments: number;
  total_completions: number;
  successful_outcomes: number;
  enrollments: { id: string; status: string; enrolled_at: string; member_id: string }[];
  recent_steps: { id: string; step_number: number; step_type: string; executed_at: string | null }[];
};

export function PlaybookDetail({ playbookId, onBack, isMobile }: PlaybookDetailProps) {
  const [playbook, setPlaybook] = useState<PlaybookData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/playbooks/${playbookId}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setPlaybook(data);
      } catch {
        // handle error silently
      } finally {
        setLoading(false);
      }
    })();
  }, [playbookId]);

  if (loading || !playbook) {
    return (
      <div className="card-base rounded-card p-8 text-center text-text-muted">
        <p className="text-sm">{loading ? "Loading playbook..." : "Playbook not found"}</p>
      </div>
    );
  }

  const successRate =
    playbook.total_completions > 0
      ? `${Math.round((playbook.successful_outcomes / playbook.total_completions) * 100)}%`
      : "—";

  const activeEnrollments = playbook.enrollments.filter((e) => e.status === "active").length;

  const toggleActive = async () => {
    await fetch(`/api/playbooks/${playbookId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !playbook.active }),
    });
    setPlaybook({ ...playbook, active: !playbook.active });
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-2.5 mb-5 flex-wrap">
        <button
          onClick={onBack}
          className="card-base rounded-button p-1.5 cursor-pointer flex items-center justify-center border border-border hover:border-border-hover transition-all duration-150"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="text-[22px]">{playbook.emoji}</span>
        <div>
          <h2 className="font-heading text-[17px] font-bold text-text-primary tracking-tight">
            {playbook.name}
          </h2>
          <p className="text-xs text-text-secondary">
            {playbook.total_enrollments} enrolled{playbook.description ? ` · ${playbook.description}` : ""}
          </p>
        </div>
        <div className="ml-auto flex gap-1.5 items-center">
          {playbook.active ? (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-pill bg-risk-low/10 text-risk-low">
              Active
            </span>
          ) : (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-pill bg-surface-input text-text-muted">
              Paused
            </span>
          )}
          <Button variant="default" size="xs" onClick={toggleActive}>
            {playbook.active ? "Pause" : "Resume"}
          </Button>
        </div>
      </div>

      <div
        className="grid gap-2.5 mb-5"
        style={{ gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)" }}
      >
        <StatBlock label="Enrolled" value={String(playbook.total_enrollments)} sub="All time" accentColor="#6e56ff" />
        <StatBlock label="Active" value={String(activeEnrollments)} sub="In progress" />
        <StatBlock label="Completed" value={String(playbook.total_completions)} sub="Finished" accentColor="#2ed573" />
        <StatBlock label="Success Rate" value={successRate} sub="Positive outcomes" accentColor="#2ed573" />
      </div>

      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}
      >
        <Card>
          <h3 className="font-heading text-[13px] font-bold text-text-primary mb-4">
            Step Funnel
          </h3>
          <StepFunnel
            steps={playbook.steps}
            enrollments={playbook.total_enrollments}
            isMobile={isMobile}
          />
        </Card>

        <Card>
          <h3 className="font-heading text-[13px] font-bold text-text-primary mb-3.5">
            Recent Activity
          </h3>
          {playbook.enrollments.length === 0 ? (
            <p className="text-xs text-text-muted">No enrollments yet.</p>
          ) : (
            <div className="flex flex-col">
              {playbook.enrollments.slice(0, 10).map((enrollment, i) => (
                <div
                  key={enrollment.id}
                  className="flex items-center gap-2.5 py-2"
                  style={{ borderBottom: i < Math.min(playbook.enrollments.length, 10) - 1 ? "1px solid var(--border)" : "none" }}
                >
                  <span className="text-sm">
                    {enrollment.status === "active" ? "🔄" : enrollment.status === "completed" ? "✅" : "⏸️"}
                  </span>
                  <span className="flex-1 text-xs text-text-secondary">
                    Member enrolled
                  </span>
                  <span className="text-[10px] text-text-muted whitespace-nowrap">
                    {timeAgo(enrollment.enrolled_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
