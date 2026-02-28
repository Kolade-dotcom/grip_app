import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    const { data: playbook, error } = await supabase
      .from("playbooks")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !playbook) {
      return NextResponse.json({ error: "Playbook not found" }, { status: 404 });
    }

    const { data: enrollments } = await supabase
      .from("playbook_enrollments")
      .select("*")
      .eq("playbook_id", id)
      .order("enrolled_at", { ascending: false })
      .limit(50);

    const { data: recentSteps } = await supabase
      .from("playbook_step_executions")
      .select("*")
      .in(
        "enrollment_id",
        (enrollments ?? []).map((e) => e.id)
      )
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({
      ...playbook,
      enrollments: enrollments ?? [],
      recent_steps: recentSteps ?? [],
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = createServerClient();

    const updateData: Record<string, unknown> = {};
    if (body.active !== undefined) updateData.active = body.active;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.steps !== undefined) updateData.steps = body.steps;
    if (body.trigger_conditions !== undefined) updateData.trigger_conditions = body.trigger_conditions;

    const { data, error } = await supabase
      .from("playbooks")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Failed to update playbook" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    await supabase.from("playbook_enrollments").delete().eq("playbook_id", id);
    await supabase.from("playbooks").delete().eq("id", id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
