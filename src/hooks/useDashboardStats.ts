"use client";

import { useState, useEffect, useCallback } from "react";
import { timeAgo } from "@/lib/utils";

interface DashboardStats {
  inPlaybooks: number;
  playbooksRunning: number;
  lastSyncedAgo: string | null;
}

interface UseDashboardStatsResult {
  stats: DashboardStats;
  loading: boolean;
  refetch: () => void;
}

export function useDashboardStats(communityId: string): UseDashboardStatsResult {
  const [stats, setStats] = useState<DashboardStats>({
    inPlaybooks: 0,
    playbooksRunning: 0,
    lastSyncedAgo: null,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!communityId) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/analytics?community_id=${encodeURIComponent(communityId)}`);
      if (!res.ok) return;

      const data = await res.json();
      setStats({
        inPlaybooks: data.in_playbooks ?? 0,
        playbooksRunning: data.playbooks_running ?? 0,
        lastSyncedAgo: data.last_synced_at ? timeAgo(data.last_synced_at) : null,
      });
    } catch {
      // Stats are supplementary — don't fail the page
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}
