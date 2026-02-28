"use client";

import { StatBlock } from "@/components/ui/StatBlock";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useAnalytics } from "@/hooks/useAnalytics";

type AnalyticsScreenProps = {
  communityId: string;
  isMobile: boolean;
};

export function AnalyticsScreen({ communityId, isMobile }: AnalyticsScreenProps) {
  const {
    riskDistribution,
    totalMembers,
    retentionRate,
    emailsSent,
    loading,
  } = useAnalytics(communityId);

  if (loading) {
    return (
      <div className="card-base rounded-card p-8 text-center text-text-muted">
        <p className="text-sm">Loading analytics...</p>
      </div>
    );
  }

  const riskBars = [
    { label: "Critical", count: riskDistribution.critical, color: "bg-risk-critical" },
    { label: "High", count: riskDistribution.high, color: "bg-risk-high" },
    { label: "Medium", count: riskDistribution.medium, color: "bg-risk-medium" },
    { label: "Low", count: riskDistribution.low, color: "bg-risk-low" },
  ];

  return (
    <div className="animate-fade-in">
      <div
        className="grid gap-2.5 mb-4"
        style={{
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
        }}
      >
        <StatBlock label="Retention Rate" value={retentionRate} sub="Active members" />
        <StatBlock label="Members Tracked" value={String(totalMembers)} sub="Total synced" />
        <StatBlock label="Emails Sent" value={String(emailsSent)} sub="All time" />
        <StatBlock
          label="At-Risk Members"
          value={String(riskDistribution.critical + riskDistribution.high)}
          sub="Critical + High"
        />
      </div>

      <Card>
        <h3 className="font-heading text-sm font-bold text-text-primary mb-4">
          Risk Distribution
        </h3>
        {totalMembers === 0 ? (
          <p className="text-sm text-text-muted">No members synced yet. Sync data to see risk distribution.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {riskBars.map((bar) => {
              const pct = riskDistribution.total > 0 ? (bar.count / riskDistribution.total) * 100 : 0;
              return (
                <div key={bar.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-text-secondary">{bar.label}</span>
                    <span className="text-xs text-text-muted">
                      {bar.count} ({Math.round(pct)}%)
                    </span>
                  </div>
                  <ProgressBar value={pct} color={bar.color} />
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
