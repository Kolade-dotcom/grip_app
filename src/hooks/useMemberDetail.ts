"use client";

import { useState, useEffect, useCallback } from "react";
import type { MemberDetail } from "@/types/member";

interface UseMemberDetailResult {
  member: MemberDetail | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useMemberDetail(memberId: string): UseMemberDetailResult {
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMember = useCallback(async () => {
    if (!memberId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/members/${memberId}`);
      if (!res.ok) {
        throw new Error(res.status === 404 ? "Member not found" : `Failed to fetch member: ${res.status}`);
      }
      const data = await res.json();
      setMember(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch member");
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);

  return { member, loading, error, refetch: fetchMember };
}
