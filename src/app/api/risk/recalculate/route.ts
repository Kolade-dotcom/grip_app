import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { calculateChurnRisk, daysUntilRenewal } from "@/lib/risk-scoring";
import type { Member } from "@/types/member";

/**
 * POST /api/risk/recalculate
 * Recalculates risk scores for all active members in a community.
 * Called by the Inngest cron job every 6 hours, or manually.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { community_id } = body;

    if (!community_id) {
      return NextResponse.json(
        { error: "community_id is required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Fetch all active members for this community
    const { data: members, error: membersError } = await supabase
      .from("members")
      .select("*")
      .eq("community_id", community_id)
      .eq("subscription_status", "active");

    if (membersError) {
      return NextResponse.json(
        { error: "Failed to fetch members", details: membersError.message },
        { status: 500 }
      );
    }

    if (!members || members.length === 0) {
      return NextResponse.json({ recalculated: 0 });
    }

    // Calculate risk for each member
    const upserts = members.map((member: Member) => {
      const result = calculateChurnRisk({
        ...member,
        days_until_renewal: daysUntilRenewal(member.current_period_end),
      });

      return {
        member_id: member.id,
        score: result.score,
        risk_level: result.level,
        risk_factors: result.factors,
        data_confidence: result.confidence,
        calculated_at: new Date().toISOString(),
      };
    });

    // Upsert all risk scores (one per member, replace existing)
    const { error: upsertError } = await supabase
      .from("risk_scores")
      .upsert(upserts, { onConflict: "member_id" });

    if (upsertError) {
      return NextResponse.json(
        { error: "Failed to save risk scores", details: upsertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      recalculated: upserts.length,
      summary: {
        critical: upserts.filter((u) => u.risk_level === "critical").length,
        high: upserts.filter((u) => u.risk_level === "high").length,
        medium: upserts.filter((u) => u.risk_level === "medium").length,
        low: upserts.filter((u) => u.risk_level === "low").length,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
