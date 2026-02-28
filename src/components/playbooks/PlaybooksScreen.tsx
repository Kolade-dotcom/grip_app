"use client";

import { useState, useEffect } from "react";
import { StatBlock } from "@/components/ui/StatBlock";
import { Button } from "@/components/ui/Button";
import { PlaybookCard } from "./PlaybookCard";
import { PlaybookDetail } from "./PlaybookDetail";
import { usePlaybooks } from "@/hooks/usePlaybooks";
import { canAccess, getPlanLabel, getUpgradeTier } from "@/lib/plan-limits";
import type { PlanTier } from "@/lib/plan-limits";

type PlaybooksScreenProps = {
  communityId: string;
  planTier: PlanTier;
  isMobile: boolean;
};

export function PlaybooksScreen({ communityId, planTier, isMobile }: PlaybooksScreenProps) {
  const { playbooks, loading, seedSystemPlaybooks } = usePlaybooks(communityId);
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const hasAccess = canAccess(planTier, "playbooks");

  useEffect(() => {
    if (!loading && playbooks.length === 0 && communityId) {
      setSeeding(true);
      seedSystemPlaybooks().finally(() => setSeeding(false));
    }
  }, [loading, playbooks.length, communityId, seedSystemPlaybooks]);

  if (selectedPlaybookId) {
    return (
      <PlaybookDetail
        playbookId={selectedPlaybookId}
        onBack={() => setSelectedPlaybookId(null)}
        isMobile={isMobile}
      />
    );
  }

  if (loading || seeding) {
    return (
      <div className="card-base rounded-card p-8 text-center text-text-muted">
        <p className="text-sm">{seeding ? "Setting up playbooks..." : "Loading playbooks..."}</p>
      </div>
    );
  }

  const totalEnrolled = playbooks.reduce((s, p) => s + p.total_enrollments, 0);
  const totalCompleted = playbooks.reduce((s, p) => s + p.total_completions, 0);
  const activePlaybooks = playbooks.filter((p) => p.active).length;

  return (
    <div className="animate-fade-in">
      <div
        className="grid gap-2.5 mb-5"
        style={{ gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)" }}
      >
        <StatBlock label="In Sequences" value={String(totalEnrolled)} sub={`${activePlaybooks} playbooks active`} accentColor="#6e56ff" />
        <StatBlock label="Completed" value={String(totalCompleted)} sub="Finished sequences" accentColor="#2ed573" />
        <StatBlock label="Active Playbooks" value={String(activePlaybooks)} sub="Currently running" accentColor="#b4a4ff" />
        <StatBlock label="Available" value={String(playbooks.length)} sub="System + custom" />
      </div>

      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}
      >
        {playbooks.map((pb, idx) => (
          <PlaybookCard
            key={pb.id}
            id={pb.id}
            name={pb.name}
            emoji={pb.emoji}
            description={pb.description}
            active={pb.active}
            totalEnrollments={pb.total_enrollments}
            totalCompletions={pb.total_completions}
            successfulOutcomes={pb.successful_outcomes}
            stepCount={Array.isArray(pb.steps) ? pb.steps.length : 0}
            steps={Array.isArray(pb.steps) ? pb.steps as { step_number: number; type: string; subject?: string }[] : undefined}
            idx={idx}
            onClick={setSelectedPlaybookId}
          />
        ))}
      </div>

      {!hasAccess && (
        <div
          className="rounded-card p-5 text-center mt-3 flex items-center justify-center gap-2 text-text-muted text-xs font-medium"
          style={{ border: "1px dashed var(--border-hover, rgba(255,255,255,0.1))", opacity: 0.7 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span>
            Custom playbook builder + more playbooks —{" "}
            <strong>Upgrade to {getPlanLabel(getUpgradeTier(planTier) ?? "starter")}</strong>
          </span>
        </div>
      )}
    </div>
  );
}
