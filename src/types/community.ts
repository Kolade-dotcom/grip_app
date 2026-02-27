export interface CommunitySettings {
  outreach_channel_priority: OutreachChannel[];
  auto_enroll_playbooks: boolean;
  daily_digest_email: boolean;
  dark_mode: boolean;
}

export type OutreachChannel = "email" | "whop_chat" | "discord" | "telegram";

export type PlanTier = "free" | "starter" | "growth" | "pro" | "enterprise";

export interface Community {
  id: string;
  whop_company_id: string;
  creator_user_id: string;
  name: string;

  discord_guild_id: string | null;
  discord_bot_installed: boolean;
  telegram_bot_installed: boolean;
  whop_chat_enabled: boolean;

  plan_tier: PlanTier;
  member_count: number;

  settings: CommunitySettings;

  created_at: string;
  updated_at: string;
}
