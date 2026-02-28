import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

/**
 * GET /api/members?community_id=...&status=...&risk_level=...&sort=...&order=...
 * List members with joined risk scores. Supports filtering and sorting.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const communityId = searchParams.get("community_id");

    if (!communityId) {
      return NextResponse.json(
        { error: "community_id is required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Build query: members left-joined with risk_scores
    let query = supabase
      .from("members")
      .select(`
        *,
        risk_scores (
          score,
          risk_level,
          risk_factors,
          data_confidence,
          calculated_at
        )
      `)
      .eq("community_id", communityId);

    // Filter by subscription status
    const status = searchParams.get("status");
    if (status) {
      query = query.eq("subscription_status", status);
    }

    // Filter by risk level (requires a join filter)
    const riskLevel = searchParams.get("risk_level");
    if (riskLevel) {
      query = query.eq("risk_scores.risk_level", riskLevel);
    }

    // Search by username or email
    const search = searchParams.get("q");
    if (search) {
      query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%,first_name.ilike.%${search}%`);
    }

    // Sorting
    const sort = searchParams.get("sort") ?? "risk_score";
    const order = searchParams.get("order") === "asc" ? true : false;

    if (sort === "risk_score") {
      // Sort by risk score descending by default (highest risk first)
      query = query.order("score", { referencedTable: "risk_scores", ascending: order });
    } else if (sort === "ltv") {
      query = query.order("ltv_cents", { ascending: order });
    } else if (sort === "tenure") {
      query = query.order("tenure_days", { ascending: order });
    } else if (sort === "renewal") {
      query = query.order("current_period_end", { ascending: true });
    } else {
      query = query.order("updated_at", { ascending: false });
    }

    // Pagination
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
    const offset = parseInt(searchParams.get("offset") ?? "0");
    query = query.range(offset, offset + limit - 1);

    const { data: members, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch members", details: error.message },
        { status: 500 }
      );
    }

    // Flatten the joined risk_scores into the member object
    const result = (members ?? []).map((member) => {
      const risk = member.risk_scores;
      // risk_scores is a one-to-one relation, Supabase returns it as object or null
      const riskData = Array.isArray(risk) ? risk[0] : risk;

      return {
        ...member,
        risk_scores: undefined,
        risk_score: riskData?.score ?? null,
        risk_level: riskData?.risk_level ?? null,
        data_confidence: riskData?.data_confidence ?? null,
        risk_factors: riskData?.risk_factors ?? [],
        risk_calculated_at: riskData?.calculated_at ?? null,
      };
    });

    // If filtering by risk_level, remove members that don't have a matching risk score
    const filtered = riskLevel
      ? result.filter((m) => m.risk_level === riskLevel)
      : result;

    return NextResponse.json({
      members: filtered,
      total: filtered.length,
      limit,
      offset,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
