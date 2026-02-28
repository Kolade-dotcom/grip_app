import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

/**
 * GET /api/analytics?community_id=...
 * Dashboard stats computed from real data: playbook enrollment counts,
 * revenue at risk, risk distribution, last sync time.
 */
export async function GET(request: NextRequest) {
  try {
    const communityId = request.nextUrl.searchParams.get("community_id");

    if (!communityId) {
      return NextResponse.json(
        { error: "community_id is required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Members enrolled in active playbooks
    const { count: inPlaybooks } = await supabase
      .from("playbook_enrollments")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .in(
        "member_id",
        // Subquery: members belonging to this community
        (
          await supabase
            .from("members")
            .select("id")
            .eq("community_id", communityId)
        ).data?.map((m) => m.id) ?? []
      );

    // Active playbooks for this community
    const { count: playbooksRunning } = await supabase
      .from("playbooks")
      .select("id", { count: "exact", head: true })
      .eq("community_id", communityId)
      .eq("active", true);

    // Last sync time (most recently updated member)
    const { data: lastSynced } = await supabase
      .from("members")
      .select("updated_at")
      .eq("community_id", communityId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    const isDetailed = request.nextUrl.searchParams.get("detailed") === "true";
    let riskDistribution = null;
    let totalMembers = 0;
    let emailsSent = 0;

    if (isDetailed) {
      const memberIds =
        (await supabase.from("members").select("id").eq("community_id", communityId))
          .data?.map((m) => m.id) ?? [];

      totalMembers = memberIds.length;

      if (memberIds.length > 0) {
        const { data: riskRows } = await supabase
          .from("risk_scores")
          .select("risk_level")
          .in("member_id", memberIds);

        const dist = { critical: 0, high: 0, medium: 0, low: 0, total: 0 };
        for (const row of riskRows ?? []) {
          const lvl = row.risk_level as keyof typeof dist;
          if (lvl in dist) dist[lvl]++;
          dist.total++;
        }
        riskDistribution = dist;

        const { count: emailCount } = await supabase
          .from("outreach_log")
          .select("id", { count: "exact", head: true })
          .eq("community_id", communityId);
        emailsSent = emailCount ?? 0;
      }
    }

    let riskTrend: unknown[] = [];
    if (isDetailed) {
      const period = parseInt(request.nextUrl.searchParams.get("period") ?? "30", 10);
      try {
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - period);
        const { data: snapshots } = await supabase
          .from("risk_score_snapshots")
          .select("snapshot_date, critical_count, high_count, medium_count, low_count")
          .eq("community_id", communityId)
          .gte("snapshot_date", sinceDate.toISOString().split("T")[0])
          .order("snapshot_date", { ascending: true });

        riskTrend = (snapshots ?? []).map((s) => ({
          date: s.snapshot_date,
          critical: s.critical_count,
          high: s.high_count,
          medium: s.medium_count,
          low: s.low_count,
        }));
      } catch {
        riskTrend = [];
      }
    }

    return NextResponse.json({
      in_playbooks: inPlaybooks ?? 0,
      playbooks_running: playbooksRunning ?? 0,
      last_synced_at: lastSynced?.updated_at ?? null,
      ...(isDetailed && {
        risk_distribution: riskDistribution,
        total_members: totalMembers,
        emails_sent: emailsSent,
        risk_trend: riskTrend,
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
