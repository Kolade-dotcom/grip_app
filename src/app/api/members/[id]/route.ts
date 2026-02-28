import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

/**
 * GET /api/members/[id]
 * Get a single member with risk scores, recent activity, and outreach history.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    // Fetch member with risk score
    const { data: member, error: memberError } = await supabase
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
      .eq("id", id)
      .single();

    if (memberError || !member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Fetch recent activity (last 30 days)
    const { data: activity } = await supabase
      .from("member_activity")
      .select("*")
      .eq("member_id", id)
      .order("date", { ascending: false })
      .limit(30);

    // Fetch outreach history
    const { data: outreach } = await supabase
      .from("outreach_log")
      .select("*")
      .eq("member_id", id)
      .order("sent_at", { ascending: false })
      .limit(20);

    // Fetch playbook enrollments
    const { data: enrollments } = await supabase
      .from("playbook_enrollments")
      .select(`
        *,
        playbooks (
          name,
          emoji
        )
      `)
      .eq("member_id", id)
      .order("enrolled_at", { ascending: false })
      .limit(10);

    // Flatten risk data
    const risk = member.risk_scores;
    const riskData = Array.isArray(risk) ? risk[0] : risk;

    return NextResponse.json({
      ...member,
      risk_scores: undefined,
      risk_score: riskData?.score ?? null,
      risk_level: riskData?.risk_level ?? null,
      data_confidence: riskData?.data_confidence ?? null,
      risk_factors: riskData?.risk_factors ?? [],
      risk_calculated_at: riskData?.calculated_at ?? null,
      activity: activity ?? [],
      outreach: outreach ?? [],
      enrollments: enrollments ?? [],
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/members/[id]
 * Update a member record (e.g. manual notes, discord_user_id linking).
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = createServerClient();

    // Only allow updating specific fields
    const allowedFields = [
      "discord_user_id",
      "telegram_user_id",
      "has_engagement_data",
    ];

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    const { data, error } = await supabase
      .from("members")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
