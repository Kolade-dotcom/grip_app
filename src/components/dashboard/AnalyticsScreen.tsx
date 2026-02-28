"use client";

import { StatBlock } from "@/components/ui/StatBlock";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { RiskTrendChart } from "@/components/charts/RiskTrendChart";
import { RiskDonutChart } from "@/components/charts/RiskDonutChart";
import { useAnalytics } from "@/hooks/useAnalytics";

type AnalyticsScreenProps = {
  communityId: string;
  isMobile: boolean;
  isDark: boolean;
};

const RISK_COLORS: Record<string, string> = {
  Critical: "#ff4757",
  High: "#ffa502",
  Medium: "#3b82f6",
  Low: "#2ed573",
};

export function AnalyticsScreen({ communityId, isMobile, isDark }: AnalyticsScreenProps) {
  const {
    riskDistribution,
    totalMembers,
    retentionRate,
    emailsSent,
    riskTrend,
    period,
    setPeriod,
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
    { label: "Critical", count: riskDistribution.critical, color: "#ff4757" },
    { label: "High", count: riskDistribution.high, color: "#ffa502" },
    { label: "Medium", count: riskDistribution.medium, color: "#3b82f6" },
    { label: "Low", count: riskDistribution.low, color: "#2ed573" },
  ];

  const atRisk = riskDistribution.critical + riskDistribution.high;

  return (
    <div className="animate-fade-in">
      {/* Row 1: StatBlocks */}
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

      {/* Row 2: Trend Chart + Donut Chart */}
      <div
        className="grid gap-3 mb-3"
        style={{ gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}
      >
        <Card>
          <RiskTrendChart
            data={riskTrend}
            isDark={isDark}
            period={period}
            onPeriodChange={setPeriod}
          />
        </Card>

        <Card>
          <h3 className="font-heading text-[13px] font-bold text-text-primary mb-2">
            Risk Distribution
          </h3>
          <RiskDonutChart
            critical={riskDistribution.critical}
            high={riskDistribution.high}
            medium={riskDistribution.medium}
            low={riskDistribution.low}
            total={riskDistribution.total}
            isDark={isDark}
          />
          {totalMembers > 0 && (
            <div className="flex flex-col gap-2 mt-3">
              {riskBars.map((bar) => {
                const pct = riskDistribution.total > 0 ? (bar.count / riskDistribution.total) * 100 : 0;
                return (
                  <div key={bar.label}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: bar.color }} />
                        <span className="text-xs font-medium text-text-primary">{bar.label}</span>
                      </div>
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

      {/* Row 3: Churn Reasons + Monthly Impact */}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}
      >
        <Card>
          <h3 className="font-heading text-[13px] font-bold text-text-primary mb-4">
            Churn Reasons (90d)
          </h3>
          <p className="text-sm text-text-muted">No data yet. Churn reasons will appear as members cancel.</p>
        </Card>

        <Card>
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
