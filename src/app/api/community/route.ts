import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

/**
 * GET /api/community?whop_company_id=...
 * Look up a community by Whop company ID.
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

    const { data: community, error } = await supabase
      .from("communities")
      .select("*")
      .eq("whop_company_id", whopCompanyId)
      .single();

    if (error || !community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(community);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
