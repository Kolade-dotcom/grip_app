"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMemberDetail } from "@/hooks/useMemberDetail";
import { useCommunity } from "@/hooks/useCommunity";
import { SubscriptionCard } from "@/components/members/SubscriptionCard";
import { RiskFactorsCard } from "@/components/members/RiskFactorsCard";
import { EngagementCard } from "@/components/members/EngagementCard";
import { PlaybookHistoryCard } from "@/components/members/PlaybookHistoryCard";
import { RiskPill } from "@/components/ui/RiskPill";
import { Button } from "@/components/ui/Button";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { initials, riskColor, formatCurrency } from "@/lib/utils";
import { canAccess } from "@/lib/plan-limits";
import type { PlanTier } from "@/types/community";

export default function MemberDetailPage({
  params,
}: {
  params: Promise<{ companyId: string; id: string }>;
}) {
  const { companyId, id } = use(params);
  const router = useRouter();

  const { member, loading, error } = useMemberDetail(id);
  const { community } = useCommunity(companyId);

  const [isDark, setIsDark] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setIsMobile(entry.contentRect.width < 640);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      document.documentElement.classList.toggle("light", prev);
      return !prev;
    });
  }, []);

  const handleBack = useCallback(() => {
    router.push(`/dashboard/${companyId}`);
  }, [router, companyId]);

  const tier: PlanTier = community?.plan_tier ?? "free";

  // Feature-gated action handler
  const handleAction = useCallback(
    (feature: string, requiredFeature: "manualEmails" | "automatedOutreach") => {
      if (!canAccess(tier, requiredFeature)) {
        setUpgradeFeature(feature);
      }
      // When implemented: open the respective modal/action
    },
    [tier]
  );

  if (loading) {
    return (
      <div ref={containerRef} className="min-h-screen bg-surface-bg transition-colors duration-300">
        <div className="sticky top-0 z-50 bg-surface-raised border-b border-border">
          <TopNav
            communityName={community?.name ?? "Loading..."}
            memberCount={community?.member_count ?? 0}
            syncedAgo="—"
            syncing={false}
            onSync={() => {}}
            onThemeToggle={toggleTheme}
            isDark={isDark}
            isMobile={isMobile}
          />
        </div>
        <div className="max-w-app mx-auto p-5">
          <div className="card-base rounded-card p-8 text-center text-text-muted">
            <p className="text-sm">Loading member details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div ref={containerRef} className="min-h-screen bg-surface-bg transition-colors duration-300">
        <div className="sticky top-0 z-50 bg-surface-raised border-b border-border">
          <TopNav
            communityName={community?.name ?? ""}
            memberCount={community?.member_count ?? 0}
            syncedAgo="—"
            syncing={false}
            onSync={() => {}}
            onThemeToggle={toggleTheme}
            isDark={isDark}
            isMobile={isMobile}
          />
        </div>
        <div className="max-w-app mx-auto p-5">
          <div className="card-base rounded-card p-8 text-center">
            <p className="text-sm text-risk-critical">{error ?? "Member not found"}</p>
            <Button variant="ghost" size="md" className="mt-4" onClick={handleBack}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const memberName = member.first_name ?? member.username ?? member.email ?? "Unknown";
  const memberInitials = initials(memberName);
  const riskLevel = member.risk_level ?? "low";
  const riskScore = member.risk_score ?? 0;
  const riskColorClass = riskColor(riskLevel);

  // Risk-colored avatar gradient
  const riskHex =
    riskLevel === "critical" ? "#ff4757" :
    riskLevel === "high" ? "#ffa502" :
    riskLevel === "medium" ? "#3b82f6" : "#2ed573";

  return (
    <div ref={containerRef} className="min-h-screen bg-surface-bg transition-colors duration-300">
      {/* Top Navigation */}
      <div className="sticky top-0 z-50 bg-surface-raised border-b border-border">
        <TopNav
          communityName={community?.name ?? ""}
          memberCount={community?.member_count ?? 0}
          syncedAgo="—"
          syncing={false}
          onSync={() => {}}
          onThemeToggle={toggleTheme}
          isDark={isDark}
          isMobile={isMobile}
        />
      </div>

      {/* Content */}
      <div
        className="max-w-app mx-auto animate-fade-in"
        style={{ padding: isMobile ? "16px 12px" : "20px 20px" }}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-5 flex-wrap">
          {/* Back button */}
          <button
            onClick={handleBack}
            className="bg-surface-card border border-border rounded-button p-1.5 cursor-pointer flex hover:border-border-hover transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-[10px] flex-shrink-0 flex items-center justify-center text-sm font-extrabold"
            style={{
              background: `linear-gradient(135deg, ${riskHex}35, ${riskHex}10)`,
              color: riskHex,
            }}
          >
            {memberInitials}
          </div>

          {/* Name + info */}
          <div className="min-w-0">
            <div className="text-lg font-bold text-text-primary font-heading">
              {memberName}
            </div>
            <div className="text-xs text-text-secondary">
              {member.email ?? "—"} · {member.plan_name ?? "No plan"}{" "}
              ({formatCurrency(member.plan_price_cents ?? 0)}/mo)
            </div>
          </div>

          {/* Risk score (right-aligned) */}
          <div className="ml-auto flex items-center gap-2.5">
            <RiskPill level={riskLevel} />
            <span
              className={`text-[28px] font-black font-heading tracking-[-0.04em] ${riskColorClass}`}
            >
              {riskScore}
            </span>
          </div>
        </div>

        {/* 2x2 Card Grid */}
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}
        >
          <SubscriptionCard member={member} />
          <RiskFactorsCard factors={member.risk_factors} riskLevel={riskLevel} />
          <EngagementCard
            activity={member.activity}
            hasEngagementData={member.has_engagement_data}
          />
          <PlaybookHistoryCard
            enrollments={member.enrollments}
            outreach={member.outreach}
          />
        </div>

        {/* Action Bar */}
        <div className="flex gap-2 mt-4 flex-wrap">
          <Button
            variant="primary"
            size="md"
            onClick={() => handleAction("Send Email", "manualEmails")}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            Send Email
          </Button>
          <Button
            variant="default"
            size="md"
            onClick={() => handleAction("Whop Chat", "manualEmails")}
          >
            💬 Whop Chat
          </Button>
          <Button
            variant="default"
            size="md"
            onClick={() => handleAction("Add Note", "manualEmails")}
          >
            📝 Add Note
          </Button>
          {(riskLevel === "critical" || riskLevel === "high") &&
            !member.enrollments.some((e) => e.status === "active") && (
              <Button
                variant="accent"
                size="md"
                onClick={() => handleAction("Start Playbook", "automatedOutreach")}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-text">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                Start Playbook
              </Button>
            )}
        </div>
      </div>

      {/* Upgrade Prompt Modal */}
      {upgradeFeature && (
        <UpgradePrompt
          feature={upgradeFeature}
          currentTier={tier}
          onClose={() => setUpgradeFeature(null)}
        />
      )}

      {/* Footer */}
      <Footer planLabel={tier} />
    </div>
  );
}
