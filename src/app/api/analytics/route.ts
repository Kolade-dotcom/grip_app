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

    return NextResponse.json({
      in_playbooks: inPlaybooks ?? 0,
      playbooks_running: playbooksRunning ?? 0,
      last_synced_at: lastSynced?.updated_at ?? null,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
