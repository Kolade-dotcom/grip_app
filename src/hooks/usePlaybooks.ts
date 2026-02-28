"use client";

import { useState, useEffect, useCallback } from "react";

type Playbook = {
  id: string;
  name: string;
  emoji: string;
  description: string | null;
  playbook_type: "system" | "custom";
  active: boolean;
  min_tier: string;
  total_enrollments: number;
  total_completions: number;
  successful_outcomes: number;
  steps: unknown[];
  trigger_conditions: unknown[];
  created_at: string;
};

type UsePlaybooksResult = {
  playbooks: Playbook[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  seedSystemPlaybooks: () => Promise<void>;
};

export function usePlaybooks(communityId: string): UsePlaybooksResult {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaybooks = useCallback(async () => {
    if (!communityId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/playbooks?community_id=${communityId}`);
      if (!res.ok) throw new Error(`Failed to fetch playbooks: ${res.status}`);
      const data = await res.json();
      setPlaybooks(data.playbooks ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch playbooks");
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  const seedSystemPlaybooks = useCallback(async () => {
    if (!communityId) return;
    try {
      await fetch("/api/playbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          community_id: communityId,
          seed_system_playbooks: true,
        }),
      });
      await fetchPlaybooks();
    } catch {
      setError("Failed to seed system playbooks");
    }
  }, [communityId, fetchPlaybooks]);

  useEffect(() => {
    fetchPlaybooks();
  }, [fetchPlaybooks]);

  return { playbooks, loading, error, refetch: fetchPlaybooks, seedSystemPlaybooks };
}
