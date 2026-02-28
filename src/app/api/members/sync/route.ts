import { NextResponse } from "next/server";
import { syncWhopMembers, syncMemberLTV } from "@/lib/sync";
import { createServerClient } from "@/lib/supabase";

/**
 * POST /api/members/sync
 * Trigger a full member sync from Whop API for a community.
 * Body: { community_id: string }
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

    // Look up the community to get the whop_company_id
    const supabase = createServerClient();
    const { data: community, error: communityError } = await supabase
      .from("communities")
      .select("whop_company_id")
      .eq("id", community_id)
      .single();

    if (communityError || !community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      );
    }

    // Sync memberships (subscription data, renewal dates, status)
    const result = await syncWhopMembers(community_id, community.whop_company_id);

    // Sync LTV from members endpoint (supplementary)
    await syncMemberLTV(community_id, community.whop_company_id);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[sync] Error syncing members:", message, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
