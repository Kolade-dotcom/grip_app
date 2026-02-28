"use client";

import { useState, useEffect } from "react";
import { StatBlock } from "@/components/ui/StatBlock";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StepFunnel } from "./StepFunnel";

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
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary mb-3 bg-transparent border-none cursor-pointer font-body"
      >
        ← Back to Playbooks
      </button>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{playbook.emoji}</span>
          <h2 className="font-heading text-lg font-bold text-text-primary">
            {playbook.name}
          </h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant={playbook.active ? "ghost" : "primary"}
            size="sm"
            onClick={toggleActive}
          >
            {playbook.active ? "Pause" : "Resume"}
          </Button>
        </div>
      </div>

      <div
        className="grid gap-2.5 mb-4"
        style={{ gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)" }}
      >
        <StatBlock label="Enrolled" value={String(playbook.total_enrollments)} sub="All time" />
        <StatBlock label="Active" value={String(activeEnrollments)} sub="In progress" />
        <StatBlock label="Completed" value={String(playbook.total_completions)} sub="Finished" />
        <StatBlock label="Success Rate" value={successRate} sub="Positive outcomes" />
      </div>

      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}
      >
        <Card>
          <h3 className="font-heading text-sm font-bold text-text-primary mb-3">
            Step Funnel
          </h3>
          <StepFunnel
            steps={playbook.steps}
            enrollments={playbook.total_enrollments}
            isMobile={isMobile}
          />
        </Card>

        <Card>
          <h3 className="font-heading text-sm font-bold text-text-primary mb-3">
            Recent Activity
          </h3>
          {playbook.enrollments.length === 0 ? (
            <p className="text-xs text-text-muted">No enrollments yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {playbook.enrollments.slice(0, 10).map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between py-1.5 border-b border-border last:border-b-0"
                >
                  <span className="text-xs text-text-secondary">
                    Member enrolled
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-pill ${
                      enrollment.status === "active"
                        ? "bg-accent/10 text-accent"
                        : enrollment.status === "completed"
                          ? "bg-risk-low/10 text-risk-low"
                          : "bg-surface-input text-text-muted"
                    }`}
                  >
                    {enrollment.status}
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
