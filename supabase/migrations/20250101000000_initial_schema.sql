-- ═══════════════════════════════════════════════════════
-- Grip — Initial Database Schema
-- ═══════════════════════════════════════════════════════

-- Communities (Whop companies that installed our app)
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whop_company_id VARCHAR NOT NULL UNIQUE,
  creator_user_id VARCHAR NOT NULL,
  name VARCHAR NOT NULL,

  -- Optional integrations
  discord_guild_id VARCHAR,
  discord_bot_installed BOOLEAN DEFAULT false,
  telegram_bot_installed BOOLEAN DEFAULT false,
  whop_chat_enabled BOOLEAN DEFAULT false,

  -- Plan & billing
  plan_tier VARCHAR DEFAULT 'free' CHECK (plan_tier IN ('free', 'starter', 'growth', 'pro', 'enterprise')),
  member_count INT DEFAULT 0,

  -- Settings
  settings JSONB DEFAULT '{
    "outreach_channel_priority": ["email", "whop_chat", "discord", "telegram"],
    "auto_enroll_playbooks": true,
    "daily_digest_email": true,
    "dark_mode": true
  }'::jsonb,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Members (synced from Whop API)
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,

  -- Whop data (Layer 1 — always available)
  whop_membership_id VARCHAR NOT NULL,
  whop_user_id VARCHAR NOT NULL,
  email VARCHAR,
  username VARCHAR,
  first_name VARCHAR,
  subscription_status VARCHAR NOT NULL, -- active, cancelled, past_due, trialing
  plan_id VARCHAR,
  plan_name VARCHAR,
  plan_price_cents INT,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT false,
  ltv_cents INT DEFAULT 0,
  tenure_days INT,
  previous_cancellations INT DEFAULT 0,
  recent_payment_failures INT DEFAULT 0,

  -- Optional platform IDs (Layer 2/3/4)
  discord_user_id VARCHAR,
  telegram_user_id VARCHAR,

  -- Computed
  has_engagement_data BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(community_id, whop_membership_id)
);

CREATE INDEX idx_members_community ON members(community_id);
CREATE INDEX idx_members_status ON members(subscription_status);

-- Engagement activity (optional — from Discord/Whop Chat/Telegram)
CREATE TABLE member_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  source VARCHAR NOT NULL CHECK (source IN ('whop_chat', 'discord', 'telegram')),
  date DATE NOT NULL,
  messages_sent INT DEFAULT 0,
  reactions_given INT DEFAULT 0,
  channels_visited INT DEFAULT 0,
  voice_minutes INT DEFAULT 0,
  last_seen_at TIMESTAMP,
  engagement_score INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(member_id, source, date)
);

CREATE INDEX idx_activity_member_date ON member_activity(member_id, date DESC);

-- Risk scores (recalculated every 6 hours, one per member)
CREATE TABLE risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE UNIQUE,
  score INT NOT NULL CHECK (score >= 0 AND score <= 100),
  risk_level VARCHAR NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_factors JSONB DEFAULT '[]'::jsonb,
  data_confidence VARCHAR DEFAULT 'medium' CHECK (data_confidence IN ('low', 'medium', 'high')),
  calculated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_risk_level ON risk_scores(risk_level, score DESC);

-- Outreach log
CREATE TABLE outreach_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id),
  channel VARCHAR NOT NULL CHECK (channel IN ('email', 'whop_chat', 'discord_dm', 'telegram', 'manual')),
  template_id VARCHAR,
  playbook_enrollment_id UUID,
  subject VARCHAR,
  content TEXT NOT NULL,

  sent_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  responded_at TIMESTAMP,
  bounced BOOLEAN DEFAULT false,
  outcome VARCHAR,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_outreach_member ON outreach_log(member_id, sent_at DESC);

-- Playbook definitions
CREATE TABLE playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id),
  name VARCHAR NOT NULL,
  emoji VARCHAR DEFAULT '🔄',
  description TEXT,
  playbook_type VARCHAR NOT NULL CHECK (playbook_type IN ('system', 'custom')),
  trigger_conditions JSONB NOT NULL,
  steps JSONB NOT NULL,
  active BOOLEAN DEFAULT true,
  min_tier VARCHAR DEFAULT 'growth', -- minimum plan tier required

  total_enrollments INT DEFAULT 0,
  total_completions INT DEFAULT 0,
  successful_outcomes INT DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Playbook enrollments
CREATE TABLE playbook_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID REFERENCES playbooks(id),
  member_id UUID REFERENCES members(id),
  current_step INT DEFAULT 0,
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'completed', 'stopped', 'failed')),
  enrolled_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  outcome VARCHAR,
  UNIQUE(playbook_id, member_id)
);

CREATE INDEX idx_enrollments_active ON playbook_enrollments(status) WHERE status = 'active';

-- Playbook step executions
CREATE TABLE playbook_step_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES playbook_enrollments(id),
  step_number INT NOT NULL,
  step_type VARCHAR NOT NULL,
  channel VARCHAR,
  scheduled_for TIMESTAMP NOT NULL,
  executed_at TIMESTAMP,
  content TEXT,
  outcome JSONB,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_steps_pending ON playbook_step_executions(scheduled_for)
  WHERE executed_at IS NULL;

-- Event log
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id),
  member_id UUID REFERENCES members(id),
  event_type VARCHAR NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_community ON events(community_id, created_at DESC);
