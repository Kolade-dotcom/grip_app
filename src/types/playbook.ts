export type PlaybookType = "system" | "custom";
export type EnrollmentStatus = "active" | "completed" | "stopped" | "failed";

export interface PlaybookTriggerCondition {
  field: string;
  operator: "eq" | "gt" | "lt" | "gte" | "lte" | "in";
  value: string | number | boolean | string[];
}

export interface PlaybookStep {
  step_number: number;
  type: "email" | "whop_chat" | "discord_dm" | "wait" | "check_engagement";
  delay_hours: number;
  template_id?: string;
  subject?: string;
  content?: string;
}

export interface Playbook {
  id: string;
  community_id: string;
  name: string;
  emoji: string;
  description: string | null;
  playbook_type: PlaybookType;
  trigger_conditions: PlaybookTriggerCondition[];
  steps: PlaybookStep[];
  active: boolean;
  min_tier: string;

  total_enrollments: number;
  total_completions: number;
  successful_outcomes: number;

  created_at: string;
}

export interface PlaybookEnrollment {
  id: string;
  playbook_id: string;
  member_id: string;
  current_step: number;
  status: EnrollmentStatus;
  enrolled_at: string;
  completed_at: string | null;
  outcome: string | null;
}

export interface PlaybookStepExecution {
  id: string;
  enrollment_id: string;
  step_number: number;
  step_type: string;
  channel: string | null;
  scheduled_for: string;
  executed_at: string | null;
  content: string | null;
  outcome: Record<string, unknown> | null;
  error: string | null;
  created_at: string;
}
