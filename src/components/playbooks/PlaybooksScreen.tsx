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
        className="grid gap-2.5 mb-4"
        style={{ gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)" }}
      >
        <StatBlock label="Total Enrolled" value={String(totalEnrolled)} sub="All playbooks" />
        <StatBlock label="Completed" value={String(totalCompleted)} sub="Finished sequences" />
        <StatBlock label="Active Playbooks" value={String(activePlaybooks)} sub="Currently running" />
        <StatBlock label="Playbooks Available" value={String(playbooks.length)} sub="System + custom" />
      </div>

      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}
      >
        {playbooks.map((pb) => (
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
            onClick={setSelectedPlaybookId}
          />
        ))}
      </div>

      {!hasAccess && (
        <div className="card-base rounded-card p-6 text-center mt-4 border border-accent/20">
          <p className="text-sm text-text-secondary mb-2">
            Upgrade to <strong>{getPlanLabel(getUpgradeTier(planTier) ?? "starter")}</strong> to activate automated playbooks.
          </p>
          <Button variant="primary" size="sm">
            Upgrade Plan
          </Button>
        </div>
      )}
    </div>
  );
}
