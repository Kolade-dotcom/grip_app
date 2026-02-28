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

  const churnReasons = [
    { reason: "Not enough value", pct: 34 },
    { reason: "Too expensive", pct: 22 },
    { reason: "Don't have time", pct: 19 },
    { reason: "Found alternative", pct: 15 },
    { reason: "Other / unknown", pct: 10 },
  ];

  const atRisk = riskDistribution.critical + riskDistribution.high;

  return (
    <div className="animate-fade-in">
      <div
        className="grid gap-2.5 mb-5"
        style={{
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
        }}
      >
        <StatBlock label="Total Members" value={String(totalMembers)} sub="Total synced" />
        <StatBlock label="Retention Rate" value={retentionRate} sub="Active members" accentColor="#2ed573" />
        <StatBlock label="Emails Sent" value={String(emailsSent)} sub="All time" />
        <StatBlock
          label="At-Risk Members"
          value={String(atRisk)}
          sub="Critical + High"
          accentColor="#ff4757"
        />
      </div>

      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}
      >
        <Card>
          <h3 className="font-heading text-[13px] font-bold text-text-primary mb-4">
            Risk Distribution
          </h3>
          {totalMembers === 0 ? (
            <p className="text-sm text-text-muted">No members synced yet. Sync data to see risk distribution.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {riskBars.map((bar) => {
                const pct = riskDistribution.total > 0 ? (bar.count / riskDistribution.total) * 100 : 0;
                return (
                  <div key={bar.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-text-primary">{bar.label}</span>
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

        <Card>
          <h3 className="font-heading text-[13px] font-bold text-text-primary mb-4">
            Churn Reasons (90d)
          </h3>
          {totalMembers === 0 ? (
            <p className="text-sm text-text-muted">No data yet. Churn reasons will appear as members cancel.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {churnReasons.map((item) => (
                <div key={item.reason}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text-primary">{item.reason}</span>
                    <span className="text-xs font-bold text-accent-text">{item.pct}%</span>
                  </div>
                  <ProgressBar value={item.pct} color="bg-accent" />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className={isMobile ? "" : "col-span-2"}>
          <h3 className="font-heading text-[13px] font-bold text-text-primary mb-4">
            Monthly Impact
          </h3>
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)" }}
          >
            {[
              { label: "Churn Prevented", value: "—", accent: false },
              { label: "Win-Backs", value: "—", accent: false },
              { label: "Upsells", value: "—", accent: false },
              { label: "Total Impact", value: "—", accent: true },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <span
                  className="text-[22px] font-extrabold font-heading tracking-tight block"
                  style={{ color: item.accent ? "#2ed573" : undefined }}
                >
                  {item.value}
                </span>
                <span className="text-[11px] text-text-muted mt-1 block">{item.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
