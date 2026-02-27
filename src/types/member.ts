export type SubscriptionStatus = "active" | "cancelled" | "past_due" | "trialing";

export interface Member {
  id: string;
  community_id: string;

  // Whop data
  whop_membership_id: string;
  whop_user_id: string;
  email: string | null;
  username: string | null;
  first_name: string | null;
  subscription_status: SubscriptionStatus;
  plan_id: string | null;
  plan_name: string | null;
  plan_price_cents: number | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  ltv_cents: number;
  tenure_days: number | null;
  previous_cancellations: number;
  recent_payment_failures: number;

  // Optional platform IDs
  discord_user_id: string | null;
  telegram_user_id: string | null;

  // Computed
  has_engagement_data: boolean;

  created_at: string;
  updated_at: string;
}

export interface MemberActivity {
  id: string;
  member_id: string;
  source: "whop_chat" | "discord" | "telegram";
  date: string;
  messages_sent: number;
  reactions_given: number;
  channels_visited: number;
  voice_minutes: number;
  last_seen_at: string | null;
  engagement_score: number;
  created_at: string;
}

/** Member with risk score joined in for list views */
export interface MemberWithRisk extends Member {
  risk_score: number | null;
  risk_level: "low" | "medium" | "high" | "critical" | null;
  data_confidence: "low" | "medium" | "high" | null;
}
