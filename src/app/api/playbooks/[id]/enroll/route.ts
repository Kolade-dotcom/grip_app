import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { enrollMember } from "@/lib/playbook-engine";
import { canAccess } from "@/lib/plan-limits";
import type { PlanTier } from "@/lib/plan-limits";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: playbookId } = await params;
    const body = await request.json();
    const { member_id, community_id } = body;

    if (!member_id || !community_id) {
      return NextResponse.json(
        { error: "member_id and community_id are required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data: community } = await supabase
      .from("communities")
      .select("plan_tier")
      .eq("id", community_id)
      .single();

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const tier = (community.plan_tier ?? "free") as PlanTier;
    if (!canAccess(tier, "playbooks")) {
      return NextResponse.json(
        { error: "Upgrade your plan to use playbooks" },
        { status: 403 }
      );
    }

    const result = await enrollMember(playbookId, member_id);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, enrollment_id: result.enrollment_id });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
