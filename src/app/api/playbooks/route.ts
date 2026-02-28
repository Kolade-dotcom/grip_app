import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { canAccess } from "@/lib/plan-limits";
import type { PlanTier } from "@/lib/plan-limits";
import { SYSTEM_PLAYBOOKS } from "@/lib/playbook-engine";

export async function GET(request: NextRequest) {
  try {
    const communityId = request.nextUrl.searchParams.get("community_id");
    if (!communityId) {
      return NextResponse.json({ error: "community_id is required" }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data: playbooks, error } = await supabase
      .from("playbooks")
      .select("*")
      .eq("community_id", communityId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ playbooks: playbooks ?? [] });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { community_id, seed_system_playbooks } = body;

    if (!community_id) {
      return NextResponse.json({ error: "community_id is required" }, { status: 400 });
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

    if (seed_system_playbooks) {
      const { data: existing } = await supabase
        .from("playbooks")
        .select("name")
        .eq("community_id", community_id)
        .eq("playbook_type", "system");

      const existingNames = new Set((existing ?? []).map((p) => p.name));

      const toInsert = SYSTEM_PLAYBOOKS.filter((p) => !existingNames.has(p.name)).map((p) => ({
        community_id,
        name: p.name,
        emoji: p.emoji,
        description: p.description,
        playbook_type: p.playbook_type,
        trigger_conditions: p.trigger_conditions,
        steps: p.steps,
        active: true,
        min_tier: p.min_tier,
      }));

      if (toInsert.length > 0) {
        await supabase.from("playbooks").insert(toInsert);
      }

      const { data: all } = await supabase
        .from("playbooks")
        .select("*")
        .eq("community_id", community_id);

      return NextResponse.json({ playbooks: all ?? [], seeded: toInsert.length });
    }

    if (!canAccess(tier, "playbooks")) {
      return NextResponse.json(
        { error: "Upgrade your plan to create playbooks" },
        { status: 403 }
      );
    }

    const { name, description, trigger_conditions, steps, emoji } = body;

    if (!name || !trigger_conditions || !steps) {
      return NextResponse.json(
        { error: "name, trigger_conditions, and steps are required" },
        { status: 400 }
      );
    }

    const { data: playbook, error } = await supabase
      .from("playbooks")
      .insert({
        community_id,
        name,
        emoji: emoji ?? "🔄",
        description: description ?? null,
        playbook_type: "custom",
        trigger_conditions,
        steps,
        active: true,
        min_tier: tier,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(playbook);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
