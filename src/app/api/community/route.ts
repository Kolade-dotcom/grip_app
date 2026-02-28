import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { whopApi } from "@/lib/whop";

/**
 * GET /api/community?whop_company_id=...
 * Look up a community by Whop company ID.
 * If the community doesn't exist yet (first install), auto-provision it
 * by fetching company details from the Whop API.
 */
export async function GET(request: NextRequest) {
  try {
    const whopCompanyId = request.nextUrl.searchParams.get("whop_company_id");

    if (!whopCompanyId) {
      return NextResponse.json(
        { error: "whop_company_id is required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Try to find existing community
    const { data: community, error } = await supabase
      .from("communities")
      .select("*")
      .eq("whop_company_id", whopCompanyId)
      .single();

    if (community) {
      return NextResponse.json(community);
    }

    // Community not found — auto-provision on first install
    // Fetch company details from Whop API
    console.log(`[community] Auto-provisioning community for ${whopCompanyId}`);

    let companyName = "My Community";
    let creatorUserId = "";

    try {
      const company = await whopApi.companies.retrieve(whopCompanyId);
      companyName = company.title ?? companyName;
      creatorUserId = company.owner_user?.id ?? "";
    } catch (whopError) {
      // If Whop API fails, still create the community with defaults
      // This allows the app to work even if the API key isn't configured yet
      console.warn(
        `[community] Could not fetch Whop company details for ${whopCompanyId}:`,
        whopError
      );
    }

    // Insert the new community record
    const { data: newCommunity, error: insertError } = await supabase
      .from("communities")
      .insert({
        whop_company_id: whopCompanyId,
        creator_user_id: creatorUserId || whopCompanyId,
        name: companyName,
        plan_tier: "free",
        member_count: 0,
        settings: {
          outreach_channel_priority: ["email", "whop_chat", "discord", "telegram"],
          auto_enroll_playbooks: true,
          daily_digest_email: true,
          dark_mode: true,
        },
      })
      .select("*")
      .single();

    if (insertError || !newCommunity) {
      console.error("[community] Failed to auto-provision community:", insertError);

      // Handle race condition — another request may have created it
      if (insertError?.code === "23505") {
        const { data: existing } = await supabase
          .from("communities")
          .select("*")
          .eq("whop_company_id", whopCompanyId)
          .single();

        if (existing) {
          return NextResponse.json(existing);
        }
      }

      return NextResponse.json(
        { error: "Failed to initialize community. Please try refreshing the page." },
        { status: 500 }
      );
    }

    console.log(`[community] Auto-provisioned community: ${newCommunity.id} (${companyName})`);
    return NextResponse.json(newCommunity);
  } catch (err) {
    console.error("[community] Internal error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { community_id, settings } = body;

    if (!community_id) {
      return NextResponse.json(
        { error: "community_id is required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (settings !== undefined) updateData.settings = settings;

    const { data, error } = await supabase
      .from("communities")
      .update(updateData)
      .eq("id", community_id)
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Failed to update community" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
