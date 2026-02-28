"use client";

import { useState, useEffect, useCallback } from "react";
import type { MemberWithRisk } from "@/types/member";
import type { RiskLevel } from "@/types/risk";

interface UseMembersOptions {
  communityId: string;
  riskLevel?: RiskLevel | "all";
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
}

interface UseMembersResult {
  members: MemberWithRisk[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  syncing: boolean;
  triggerSync: () => Promise<void>;
  counts: Record<"all" | RiskLevel, number>;
}

export function useMembers({
  communityId,
  riskLevel = "all",
  search,
  sort = "risk_score",
  order = "desc",
}: UseMembersOptions): UseMembersResult {
  const [members, setMembers] = useState<MemberWithRisk[]>([]);
  const [allMembers, setAllMembers] = useState<MemberWithRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!communityId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        community_id: communityId,
        sort,
        order,
        limit: "100",
      });
      if (search) params.set("q", search);

      const res = await fetch(`/api/members?${params}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch members: ${res.status}`);
      }

      const data = await res.json();
      setAllMembers(data.members);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch members");
    } finally {
      setLoading(false);
    }
  }, [communityId, search, sort, order]);

  // Filter locally for risk level (avoids extra API call on tab switch)
  useEffect(() => {
    if (riskLevel === "all") {
      setMembers(allMembers);
    } else {
      setMembers(allMembers.filter((m) => m.risk_level === riskLevel));
    }
  }, [allMembers, riskLevel]);

  // Compute counts from allMembers
  const counts: Record<"all" | RiskLevel, number> = {
    all: allMembers.length,
    critical: allMembers.filter((m) => m.risk_level === "critical").length,
    high: allMembers.filter((m) => m.risk_level === "high").length,
    medium: allMembers.filter((m) => m.risk_level === "medium").length,
    low: allMembers.filter((m) => m.risk_level === "low").length,
  };

  // Trigger Whop data sync
  const triggerSync = useCallback(async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/members/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ community_id: communityId }),
      });
      if (!res.ok) throw new Error("Sync failed");

      // After sync, recalculate risk scores
      await fetch("/api/risk/recalculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ community_id: communityId }),
      });

      // Refetch members with updated data
      await fetchMembers();
    } catch {
      setError("Failed to sync data from Whop");
    } finally {
      setSyncing(false);
    }
  }, [communityId, fetchMembers]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return {
    members,
    loading,
    error,
    refetch: fetchMembers,
    syncing,
    triggerSync,
    counts,
  };
}
