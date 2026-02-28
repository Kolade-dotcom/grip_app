import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { sendToMember, EMAIL_TEMPLATES, renderTemplate } from "@/lib/outreach";
import { canAccess } from "@/lib/plan-limits";
import type { PlanTier } from "@/lib/plan-limits";
import type { Member } from "@/types/member";
import type { Community } from "@/types/community";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { member_id, community_id, template_id, subject, content, variables } = body;

    if (!member_id || !community_id) {
      return NextResponse.json(
        { error: "member_id and community_id are required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data: community } = await supabase
      .from("communities")
      .select("*")
      .eq("id", community_id)
      .single();

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const tier = (community.plan_tier ?? "free") as PlanTier;
    if (!canAccess(tier, "manualEmails")) {
      return NextResponse.json(
        { error: "Upgrade to Starter or above to send emails" },
        { status: 403 }
      );
    }

    const { data: member } = await supabase
      .from("members")
      .select("*")
      .eq("id", member_id)
      .single();

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    let emailSubject = subject;
    let emailBody = content;

    if (template_id) {
      const template = EMAIL_TEMPLATES.find((t) => t.id === template_id);
      if (!template) {
        return NextResponse.json({ error: "Template not found" }, { status: 404 });
      }
      const rendered = renderTemplate(template, variables ?? {});
      emailSubject = rendered.subject;
      emailBody = rendered.body;
    }

    if (!emailBody) {
      return NextResponse.json({ error: "Email content is required" }, { status: 400 });
    }

    const result = await sendToMember(
      member as unknown as Member,
      community as unknown as Community,
      { subject: emailSubject, body: emailBody },
      { template_id }
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "Failed to send message" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      channel: result.channel,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
