import { createServerClient } from "@/lib/supabase";
import { sendToMember } from "@/lib/outreach";
import type { Member } from "@/types/member";
import type { Community } from "@/types/community";

export type PlaybookStep = {
  step_number: number;
  type: "email" | "wait" | "check_status";
  delay_hours: number;
  template_id?: string;
  subject?: string;
  content?: string;
};

export type TriggerCondition = {
  field: string;
  operator: "eq" | "gt" | "lt" | "gte" | "lte" | "in";
  value: string | number | string[];
};

export function checkTriggerConditions(
  member: Record<string, unknown>,
  conditions: TriggerCondition[]
): boolean {
  for (const cond of conditions) {
    const val = member[cond.field];
    switch (cond.operator) {
      case "eq":
        if (val !== cond.value) return false;
        break;
      case "gt":
        if (typeof val !== "number" || val <= (cond.value as number)) return false;
        break;
      case "lt":
        if (typeof val !== "number" || val >= (cond.value as number)) return false;
        break;
      case "gte":
        if (typeof val !== "number" || val < (cond.value as number)) return false;
        break;
      case "lte":
        if (typeof val !== "number" || val > (cond.value as number)) return false;
        break;
      case "in":
        if (!Array.isArray(cond.value) || !cond.value.includes(String(val))) return false;
        break;
    }
  }
  return true;
}

export async function enrollMember(
  playbookId: string,
  memberId: string
): Promise<{ enrollment_id: string } | { error: string }> {
  const supabase = createServerClient();

  const { data: existing } = await supabase
    .from("playbook_enrollments")
    .select("id, status")
    .eq("playbook_id", playbookId)
    .eq("member_id", memberId)
    .single();

  if (existing && existing.status === "active") {
    return { error: "Member already enrolled in this playbook" };
  }

  const { data: playbook } = await supabase
    .from("playbooks")
    .select("steps")
    .eq("id", playbookId)
    .single();

  if (!playbook) return { error: "Playbook not found" };

  const steps = playbook.steps as PlaybookStep[];
  const now = new Date();

  if (existing) {
    await supabase
      .from("playbook_enrollments")
      .update({ status: "active", current_step: 0, enrolled_at: now.toISOString(), completed_at: null, outcome: null })
      .eq("id", existing.id);

    await scheduleSteps(existing.id, steps, now);
    await incrementEnrollmentCount(playbookId);
    return { enrollment_id: existing.id };
  }

  const { data: enrollment, error } = await supabase
    .from("playbook_enrollments")
    .insert({
      playbook_id: playbookId,
      member_id: memberId,
      current_step: 0,
      status: "active",
      enrolled_at: now.toISOString(),
    })
    .select("id")
    .single();

  if (error || !enrollment) return { error: error?.message ?? "Failed to enroll" };

  await scheduleSteps(enrollment.id, steps, now);
  await incrementEnrollmentCount(playbookId);

  return { enrollment_id: enrollment.id };
}

async function scheduleSteps(
  enrollmentId: string,
  steps: PlaybookStep[],
  startTime: Date
): Promise<void> {
  const supabase = createServerClient();
  let cumulativeHours = 0;

  for (const step of steps) {
    cumulativeHours += step.delay_hours;
    const scheduledFor = new Date(
      startTime.getTime() + cumulativeHours * 60 * 60 * 1000
    );

    await supabase.from("playbook_step_executions").insert({
      enrollment_id: enrollmentId,
      step_number: step.step_number,
      step_type: step.type,
      channel: step.type === "email" ? "email" : null,
      scheduled_for: scheduledFor.toISOString(),
      content: step.content ?? null,
    });
  }
}

async function incrementEnrollmentCount(playbookId: string): Promise<void> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("playbooks")
    .select("total_enrollments")
    .eq("id", playbookId)
    .single();

  if (data) {
    await supabase
      .from("playbooks")
      .update({ total_enrollments: (data.total_enrollments ?? 0) + 1 })
      .eq("id", playbookId);
  }
}

export async function executePendingSteps(): Promise<{
  executed: number;
  errors: string[];
}> {
  const supabase = createServerClient();
  const now = new Date().toISOString();

  const { data: pendingSteps } = await supabase
    .from("playbook_step_executions")
    .select(
      "id, enrollment_id, step_number, step_type, channel, content"
    )
    .is("executed_at", null)
    .lte("scheduled_for", now)
    .order("scheduled_for", { ascending: true })
    .limit(50);

  if (!pendingSteps || pendingSteps.length === 0) {
    return { executed: 0, errors: [] };
  }

  let executed = 0;
  const errors: string[] = [];

  for (const step of pendingSteps) {
    try {
      if (step.step_type === "wait" || step.step_type === "check_status") {
        await supabase
          .from("playbook_step_executions")
          .update({ executed_at: now, outcome: { status: "completed" } })
          .eq("id", step.id);
        executed++;
        continue;
      }

      if (step.step_type === "email") {
        const { data: enrollment } = await supabase
          .from("playbook_enrollments")
          .select("member_id, playbook_id")
          .eq("id", step.enrollment_id)
          .single();

        if (!enrollment) {
          errors.push(`Step ${step.id}: enrollment not found`);
          continue;
        }

        const { data: member } = await supabase
          .from("members")
          .select("*, community_id")
          .eq("id", enrollment.member_id)
          .single();

        if (!member) {
          errors.push(`Step ${step.id}: member not found`);
          continue;
        }

        const { data: community } = await supabase
          .from("communities")
          .select("*")
          .eq("id", member.community_id)
          .single();

        if (!community) {
          errors.push(`Step ${step.id}: community not found`);
          continue;
        }

        const result = await sendToMember(
          member as unknown as Member,
          community as unknown as Community,
          {
            subject: "Retention check-in",
            body: step.content ?? "We wanted to check in with you.",
          },
          { playbook_enrollment_id: step.enrollment_id }
        );

        await supabase
          .from("playbook_step_executions")
          .update({
            executed_at: now,
            outcome: { channel: result.channel, success: result.success },
          })
          .eq("id", step.id);

        if (result.success) executed++;
        else errors.push(`Step ${step.id}: send failed`);
      }

      await supabase
        .from("playbook_enrollments")
        .update({ current_step: step.step_number })
        .eq("id", step.enrollment_id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Step ${step.id}: ${msg}`);
      await supabase
        .from("playbook_step_executions")
        .update({ executed_at: now, error: msg })
        .eq("id", step.id);
    }
  }

  return { executed, errors };
}

export const SYSTEM_PLAYBOOKS = [
  {
    name: "New Member Fast Start",
    emoji: "🚀",
    description: "Welcome sequence for new members in their first 7 days",
    playbook_type: "system" as const,
    min_tier: "starter",
    trigger_conditions: [
      { field: "tenure_days", operator: "lt" as const, value: 7 },
      { field: "subscription_status", operator: "eq" as const, value: "active" },
    ],
    steps: [
      { step_number: 1, type: "email" as const, delay_hours: 0, template_id: "welcome_fast_start", subject: "Welcome!", content: "Welcome to the community!" },
      { step_number: 2, type: "wait" as const, delay_hours: 48 },
      { step_number: 3, type: "email" as const, delay_hours: 0, subject: "How's it going?", content: "Checking in on your first week" },
    ],
  },
  {
    name: "Silent Revival",
    emoji: "👻",
    description: "Re-engage members who have gone quiet",
    playbook_type: "system" as const,
    min_tier: "growth",
    trigger_conditions: [
      { field: "risk_level", operator: "in" as const, value: ["high", "critical"] },
    ],
    steps: [
      { step_number: 1, type: "email" as const, delay_hours: 0, template_id: "check_in", subject: "We miss you!", content: "We noticed you've been quiet" },
      { step_number: 2, type: "wait" as const, delay_hours: 72 },
      { step_number: 3, type: "check_status" as const, delay_hours: 0 },
      { step_number: 4, type: "email" as const, delay_hours: 24, subject: "Still there?", content: "Just checking in one more time" },
    ],
  },
  {
    name: "Renewal Risk",
    emoji: "⏰",
    description: "Proactive outreach before renewal for at-risk members",
    playbook_type: "system" as const,
    min_tier: "growth",
    trigger_conditions: [
      { field: "days_until_renewal", operator: "lte" as const, value: 7 },
      { field: "risk_level", operator: "in" as const, value: ["medium", "high", "critical"] },
    ],
    steps: [
      { step_number: 1, type: "email" as const, delay_hours: 0, template_id: "renewal_reminder", subject: "Your renewal is coming up", content: "Renewal reminder" },
      { step_number: 2, type: "wait" as const, delay_hours: 48 },
      { step_number: 3, type: "check_status" as const, delay_hours: 0 },
    ],
  },
  {
    name: "Payment Recovery",
    emoji: "💳",
    description: "Recover failed payments before involuntary churn",
    playbook_type: "system" as const,
    min_tier: "growth",
    trigger_conditions: [
      { field: "recent_payment_failures", operator: "gt" as const, value: 0 },
    ],
    steps: [
      { step_number: 1, type: "email" as const, delay_hours: 0, template_id: "payment_recovery", subject: "Payment issue", content: "Please update your payment" },
      { step_number: 2, type: "wait" as const, delay_hours: 48 },
      { step_number: 3, type: "email" as const, delay_hours: 0, subject: "Urgent: payment needed", content: "Your access may be interrupted" },
    ],
  },
];
