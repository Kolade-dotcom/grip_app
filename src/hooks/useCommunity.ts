"use client";

import { useState, useEffect, useCallback } from "react";
import type { Community } from "@/types/community";

interface UseCommunityResult {
  community: Community | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetch community data by Whop company ID.
 * Looks up the community in our DB by whop_company_id.
 */
export function useCommunity(whopCompanyId: string): UseCommunityResult {
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCommunity = useCallback(async () => {
    if (!whopCompanyId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/community?whop_company_id=${encodeURIComponent(whopCompanyId)}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch community: ${res.status}`);
      }
      const data = await res.json();
      setCommunity(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch community");
    } finally {
      setLoading(false);
    }
  }, [whopCompanyId]);

  useEffect(() => {
    fetchCommunity();
  }, [fetchCommunity]);

  return { community, loading, error, refetch: fetchCommunity };
}
