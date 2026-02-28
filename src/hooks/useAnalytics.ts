"use client";

import { useState, useEffect, useCallback } from "react";

type RiskDistribution = {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
};

type RiskTrendPoint = {
  date: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
};

type AnalyticsData = {
  riskDistribution: RiskDistribution;
  totalMembers: number;
  retentionRate: string;
  emailsSent: number;
  outreachResponseRate: string;
  riskTrend: RiskTrendPoint[];
  period: 7 | 30 | 90;
  setPeriod: (p: 7 | 30 | 90) => void;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useAnalytics(communityId: string): AnalyticsData {
  const [riskDistribution, setRiskDistribution] = useState<RiskDistribution>({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    total: 0,
  });
  const [totalMembers, setTotalMembers] = useState(0);
  const [emailsSent, setEmailsSent] = useState(0);
  const [riskTrend, setRiskTrend] = useState<RiskTrendPoint[]>([]);
  const [period, setPeriod] = useState<7 | 30 | 90>(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!communityId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/analytics?community_id=${communityId}&detailed=true&period=${period}`
      );
      if (!res.ok) throw new Error(`Failed to fetch analytics: ${res.status}`);
      const data = await res.json();

      setRiskDistribution(
        data.risk_distribution ?? { critical: 0, high: 0, medium: 0, low: 0, total: 0 }
      );
      setTotalMembers(data.total_members ?? 0);
      setEmailsSent(data.emails_sent ?? 0);
      setRiskTrend(data.risk_trend ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  }, [communityId, period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const activeMembers = totalMembers > 0 ? totalMembers - riskDistribution.critical : totalMembers;
  const retentionRate =
    totalMembers > 0 ? `${Math.round((activeMembers / totalMembers) * 100)}%` : "—";
  const outreachResponseRate = "—";

  return {
    riskDistribution,
    totalMembers,
    retentionRate,
    emailsSent,
    outreachResponseRate,
    riskTrend,
    period,
    setPeriod,
    loading,
    error,
    refetch: fetchAnalytics,
  };
}
