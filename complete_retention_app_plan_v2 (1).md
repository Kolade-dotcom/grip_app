# Grip — Revised Product Plan (v2.0)
## AI-Powered Member Retention for Whop Communities
### Complete Product Vision & Development Plan

---

## Revision Notes (v2.0 Changes from v1.0)

> **Key strategic shifts in this revision:**
> 1. **Whop-native app** — Build inside Whop's app ecosystem using their iFrame SDK, not a standalone SaaS
> 2. **Whop-first data** — Primary data source is Whop API (subscriptions, payments, membership activity); Discord/Telegram are optional add-on integrations
> 3. **Leaner MVP** — 4-week MVP focused on risk alerts, not a full polished dashboard
> 4. **Email-first outreach** — Playbook interventions default to email (TOS-safe), with Discord/Telegram as opt-in channels
> 5. **Pricing restructure** — Permanent free tier (50 members, read-only), $49 Starter added, 5-tier value ladder
> 6. **Honest metrics** — All success projections clearly labeled as targets/hypotheses to validate
> 7. **Playbook engine is the product** — Positioning shifted from "retention dashboard" to "automated retention playbooks"

---

## Executive Summary

**Product Name:** Grip

**Core Value Proposition:** Automated retention playbooks that detect at-risk community members and execute multi-step interventions to prevent cancellations — without manual work.

**What This Is NOT:** Another analytics dashboard. Whop already provides basic analytics (churn revenue, new users, top users). Grip is an **action engine** — it doesn't just show you who's leaving, it stops them from leaving.

**Distribution:** Native Whop app, listed in Whop's app store (297+ apps, 4M+ monthly marketplace visitors). Embedded via iFrame inside the creator's Whop dashboard.

**Target Market:** Whop creators with 200-5,000 members across trading, betting, reselling, fitness, and education niches. Secondary market: any Discord/Telegram community operator.

**Business Model:** SaaS subscription with tiered pricing:
- Free: Up to 50 members (risk scores only, read-only dashboard)
- Starter: $49/month (up to 500 members, 1 playbook, manual outreach)
- Growth: $149/month (up to 2,000 members, 3 automated playbooks)
- Pro: $299/month (unlimited members, all playbooks + custom builder)
- Enterprise: $999/month (multi-community, white-label, dedicated support)

**Revenue Projection (Conservative):**
- Month 4: 25 customers = $3K-4K MRR
- Month 6: 60 customers = $8K-11K MRR
- Month 12: 150 customers = $25K-30K MRR

**Development Timeline:** 4-week MVP → 2-week beta → ongoing feature rollout

**Key Innovation:** Industry-first automated retention playbooks purpose-built for creator communities, using channel-agnostic outreach (email → Whop chat → Discord/Telegram) that adapts based on member response.

---

## Part 1: Core Product

### 1.1 Product Overview

**The Problem:**
Community creators lose 40-60% of members within the first 3 months. By the time they notice someone's disengaged, it's too late. Manual retention work takes 10-15 hours/week with poor results. Whop's built-in analytics show you churned revenue after the fact, but don't predict it or help prevent it.

**The Solution:**
A Whop-native app that:
1. Ingests subscription + payment data from Whop API (automatic, no setup)
2. Optionally enriches with engagement data from Discord, Telegram, or Whop Chat
3. Predicts churn risk before it happens
4. Executes automated multi-step retention playbooks via email, Whop chat, and optionally Discord/Telegram
5. Shows creators exactly what's working and the revenue they've saved

**Why a Whop App (Not Standalone SaaS):**
- **Zero-friction distribution:** Creators discover and install from Whop's app store
- **Instant data access:** Whop app SDK provides subscription, payment, and membership data without complex OAuth flows
- **Trust:** "Official Whop app" badge vs. random third-party tool asking for API keys
- **Billing simplicity:** Can bill through Whop's payment infrastructure or external Stripe
- **Embedded experience:** App loads inside the creator's existing Whop dashboard via iFrame — no context switching

### 1.2 Core Features (MVP — Free + Starter Tiers)

#### 1.2.1 Data Integration (Layered Approach)

**Layer 1: Whop API (Automatic — No Setup Required)**
This is the foundation. Every creator who installs the app gets this immediately:
- Member list with subscription status (active/cancelled/past_due/trialing)
- Billing dates, renewal timing, plan pricing
- Payment history and failure detection
- Join date, tenure, LTV calculation
- Cancellation events and reasons (if provided)
- Whop-native activity data (course completions, chat messages if using Whop Chat app)

```javascript
// Whop SDK initialization (native app context)
import Whop from "@whop/sdk";

const client = new Whop({
  apiKey: process.env.WHOP_API_KEY,
  appID: process.env.WHOP_APP_ID,
});

// Fetch all memberships for the company that installed our app
async function syncMembers(companyId) {
  const memberships = await client.memberships.list({
    company_id: companyId,
    per_page: 50,
  });
  
  for (const membership of memberships.data) {
    await upsertMember({
      whop_membership_id: membership.id,
      whop_user_id: membership.user_id,
      email: membership.user?.email,
      status: membership.status, // active, cancelled, past_due, trialing
      plan_id: membership.plan_id,
      current_period_start: membership.current_period_start,
      current_period_end: membership.current_period_end,
      cancel_at_period_end: membership.cancel_at_period_end,
      created_at: membership.created_at,
    });
  }
}

// Listen for real-time webhook events
// membership.went_valid, membership.went_invalid, 
// payment.succeeded, payment.failed, etc.
```

**Layer 2: Whop Chat Activity (Auto-detected if Chat app is installed)**
If the creator uses Whop's native Chat app:
- Message count per member
- Last active timestamp
- Channel participation
- Reactions and interactions

**Layer 3: Discord Integration (Optional Add-On)**
Only if the creator explicitly connects their Discord server:
- Discord bot tracks messages, reactions, voice time, last seen
- Account linking via Whop user ID ↔ Discord user ID
- Requires creator to install Discord bot + authorize

**Layer 4: Telegram Integration (Optional Add-On)**
For communities using Telegram:
- Telegram bot tracks messages, media shares, last seen
- Account linking via Whop user ID ↔ Telegram user ID

**Why This Layered Approach Matters:**
- Layer 1 alone is enough to detect churn risk (payment failures, renewal proximity, cancellation signals, tenure patterns)
- Each additional layer improves prediction accuracy
- Creators can start getting value in under 60 seconds (install app → see at-risk members) without configuring Discord/Telegram bots
- No single-platform dependency

#### 1.2.2 Risk Scoring Algorithm

**V1: Subscription-Data-Only Risk Score (Works with just Whop API)**
```javascript
function calculateChurnRisk(member) {
  let riskScore = 0;
  const riskFactors = [];
  
  // 1. Renewal proximity + low engagement signals (0-25 points)
  const daysUntilRenewal = member.days_until_renewal;
  if (daysUntilRenewal !== null && daysUntilRenewal <= 7 && daysUntilRenewal > 0) {
    riskScore += 15;
    riskFactors.push({
      factor: "renewal_imminent",
      severity: "high",
      description: `Renewal in ${daysUntilRenewal} days`
    });
    
    // Extra risk if cancel_at_period_end is set
    if (member.cancel_at_period_end) {
      riskScore += 10;
      riskFactors.push({
        factor: "cancellation_scheduled",
        severity: "critical",
        description: "Member has already scheduled cancellation"
      });
    }
  }
  
  // 2. Payment failures (0-25 points)
  if (member.recent_payment_failures > 0) {
    riskScore += 20;
    riskFactors.push({
      factor: "payment_failure",
      severity: "critical",
      description: `${member.recent_payment_failures} failed payment(s) in last 30 days`
    });
    if (member.recent_payment_failures >= 2) {
      riskScore += 5;
    }
  }
  
  // 3. Early lifecycle risk — "never onboarded" (0-20 points)
  if (member.tenure_days < 14) {
    riskScore += 10;
    riskFactors.push({
      factor: "new_member",
      severity: "medium",
      description: `Joined ${member.tenure_days} days ago — critical onboarding window`
    });
    // If no engagement data available (no chat layer), flag extra risk
    if (!member.has_engagement_data) {
      riskScore += 10;
      riskFactors.push({
        factor: "no_engagement_visibility",
        severity: "medium",
        description: "No engagement tracking connected — consider adding Discord/Chat integration"
      });
    }
  }
  
  // 4. Short tenure + approaching first renewal (0-15 points)
  if (member.tenure_days < 35 && daysUntilRenewal !== null && daysUntilRenewal <= 10) {
    riskScore += 15;
    riskFactors.push({
      factor: "first_renewal_risk",
      severity: "high",
      description: "Approaching first renewal — highest churn window"
    });
  }
  
  // 5. Previous cancellation/reactivation (0-10 points)
  if (member.previous_cancellations > 0) {
    riskScore += 10;
    riskFactors.push({
      factor: "repeat_churn_risk",
      severity: "medium",
      description: `Previously cancelled ${member.previous_cancellations} time(s)`
    });
  }
  
  // 6. Engagement data (if available from Layer 2/3/4) (0-30 points)
  if (member.has_engagement_data) {
    const engagementRisk = calculateEngagementRisk(member.engagement);
    riskScore += engagementRisk.score;
    riskFactors.push(...engagementRisk.factors);
  }
  
  return {
    score: Math.min(riskScore, 100),
    level: riskScore > 70 ? "critical" : riskScore > 40 ? "high" : riskScore > 20 ? "medium" : "low",
    factors: riskFactors,
    daysUntilLikelyChurn: estimateChurnTiming(riskScore, member),
    data_confidence: member.has_engagement_data ? "high" : "medium"
  };
}

// Separate function for engagement-based risk (only runs if Layer 2/3/4 data exists)
function calculateEngagementRisk(engagement) {
  let score = 0;
  const factors = [];
  
  // Complete silence from previously active member
  if (engagement.messages_7d === 0 && engagement.avg_messages_per_week > 5) {
    score += 20;
    factors.push({
      factor: "gone_silent",
      severity: "critical",
      description: `No activity 7+ days (usually ${engagement.avg_messages_per_week} msgs/week)`
    });
  }
  
  // Engagement velocity declining
  if (engagement.engagement_velocity < -0.3) {
    score += 10;
    factors.push({
      factor: "engagement_declining",
      severity: "high",
      description: `Engagement dropping ${Math.round(Math.abs(engagement.engagement_velocity) * 100)}% week-over-week`
    });
  }
  
  return { score: Math.min(score, 30), factors };
}

function estimateChurnTiming(riskScore, member) {
  if (member.cancel_at_period_end) return member.days_until_renewal || 1;
  if (riskScore > 80) return 7;
  if (riskScore > 60) return 14;
  if (riskScore > 40) return 30;
  return 60;
}
```

**Risk Categories:**
- **Critical (70-100):** Immediate intervention needed — likely to cancel within 7-14 days
- **High (40-69):** Intervention recommended — likely to cancel within 30 days
- **Medium (20-39):** Monitor closely — potential risk within 60 days
- **Low (0-19):** Healthy member — maintain engagement

#### 1.2.3 Creator Dashboard (Whop iFrame App)

The dashboard loads inside the creator's Whop admin panel as a native app. Built with Next.js, rendered in Whop's iFrame container.

**Member Risk View (Primary Screen):**
```
┌─────────────────────────────────────────────────────────────────┐
│ Grip                            [Settings ⚙️]                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────────────┐│
│ │ $8,420   │ │ 23       │ │ 67       │ │ 3 playbooks active ││
│ │ Revenue  │ │ Critical │ │ High     │ │ 43 members in       ││
│ │ at Risk  │ │ Risk     │ │ Risk     │ │ sequences           ││
│ └──────────┘ └──────────┘ └──────────┘ └─────────────────────┘│
│                                                                  │
│ Data Sources: ✅ Whop API  ⚠️ Discord (not connected)          │
│              [+ Connect Discord] [+ Connect Telegram]           │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ At-Risk Members                  [Filter ▼] [Sort: Risk ▼]     │
├─────────────────────────────────────────────────────────────────┤
│ 🔴 Jake1987    Risk: 87   Renewal: 8 days   LTV: $1,592       │
│    Cancellation scheduled • Payment failed last week            │
│    [▶ Start Playbook] [✉ Send Email]                           │
│                                                                  │
│ 🔴 Sarah_T     Risk: 82   Renewal: 12 days  LTV: $398         │
│    First renewal approaching • No engagement data               │
│    [▶ Start Playbook] [✉ Send Email]                           │
│                                                                  │
│ 🟡 Mike_Crypto Risk: 58   Renewal: 22 days  LTV: $2,985       │
│    Engagement dropped 45% (Discord) • High-value member         │
│    [▶ Start Playbook] [✉ Send Email]                           │
│                                                                  │
│ 🟢 Alex_Wins   Risk: 12   Renewal: 45 days  LTV: $4,200       │
│    Top 5% engagement • Upsell opportunity detected              │
│    [💎 VIP Offer]                                               │
└─────────────────────────────────────────────────────────────────┘
```

**Member Detail View:**
```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back    Jake1987                             Risk: 87% 🔴     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Subscription:                                                    │
│ Plan: Premium ($199/mo) • Since: Apr 15, 2024 (8 months)       │
│ Next renewal: Dec 29 (8 days) • ⚠️ CANCELLATION SCHEDULED     │
│ LTV: $1,592 • Payment failures: 1 (Dec 14)                     │
│                                                                  │
│ Risk Factors:                                                    │
│ 🔴 Cancellation already scheduled for end of billing period     │
│ 🔴 Payment failed on Dec 14 (card declined)                    │
│ 🟡 Renewal in 8 days                                            │
│ 🟡 No activity for 6 days (Discord) — usually 12 msgs/week    │
│                                                                  │
│ Engagement (requires Discord/Chat):                              │
│ [Line chart: messages/week declining from 12 → 0]              │
│ OR: "Connect Discord to see engagement history"                 │
│                                                                  │
│ Playbook Status:                                                 │
│ ⏳ "Renewal Risk Mitigation" — Step 2 of 5 (email sent Day -7) │
│ Last action: Value reminder email sent Dec 22 • Opened ✅       │
│                                                                  │
│ Intervention History:                                            │
│ • Dec 22: Email "Value Reminder" — Opened ✅, No reply         │
│ • Dec 20: (system) Payment failure detected                     │
│ • Nov 15: Email "Monthly Highlights" — Opened ✅, Clicked ✅   │
│                                                                  │
│ [✉ Send Email] [💬 Send via Whop Chat] [📝 Add Note]          │
└─────────────────────────────────────────────────────────────────┘
```

#### 1.2.4 Outreach System (Channel-Agnostic)

**Channel Priority (Default Order — Creator Can Customize):**
1. **Email** (always available via Whop user data — TOS-safe, highest deliverability)
2. **Whop Chat** (if creator uses Whop's Chat app — native, no TOS risk)
3. **Discord DM** (if Discord integration connected — use cautiously, respect rate limits)
4. **Telegram** (if Telegram integration connected)

**Why Email-First:**
- Every Whop member has an email on file — 100% reachability
- No TOS risk (Discord bots sending mass DMs can get flagged/banned)
- Open/click tracking is trivial (SendGrid, Resend, etc.)
- Works even if member has left Discord server but subscription is still active
- Professional context — members expect transactional/relationship emails from subscriptions

**Email Templates (Free Tier — Manual Send Only):**
```javascript
const emailTemplates = [
  {
    id: "check_in_inactive",
    name: "Check-in (Inactive Member)",
    trigger: "Manual — member appears at risk",
    subject: "Miss seeing you around, {{firstName}}",
    body: `Hey {{firstName}},

Haven't seen you around {{communityName}} lately — everything okay?

We've had some great discussions and new content drop since you were last active. Here's what you missed:

{{recentHighlights}}

Let me know if there's anything I can help with or if you have feedback.

— {{creatorName}}`,
  },
  
  {
    id: "renewal_reminder",
    name: "Pre-Renewal Value Check",
    trigger: "Manual — renewal approaching + low engagement",
    subject: "Quick check-in before your renewal, {{firstName}}",
    body: `Hey {{firstName}},

Your {{communityName}} membership renews in {{daysUntilRenewal}} days. Before then, wanted to make sure you're getting value.

Here's a quick look at what's been happening:
{{recentHighlights}}

Are you getting what you need? Happy to chat if you have any feedback.

— {{creatorName}}`,
  },
  
  {
    id: "payment_failed",
    name: "Payment Recovery",
    trigger: "Manual — payment failure detected",
    subject: "Action needed: Your {{communityName}} payment didn't go through",
    body: `Hey {{firstName}},

Heads up — your latest payment for {{communityName}} didn't go through.

You can update your payment method here: {{updatePaymentLink}}

Your access stays active for now, but we don't want you to lose your spot (or your {{tenureDays}}-day streak!).

Takes 1 minute to fix. Let me know if you need help.

— {{creatorName}}`,
  },
  
  {
    id: "welcome_new",
    name: "Welcome + Onboarding",
    trigger: "Manual — new member joined",
    subject: "Welcome to {{communityName}}, {{firstName}}! Here's how to get started",
    body: `Welcome aboard, {{firstName}}! 🎉

Excited to have you in {{communityName}}. Here's how to get the most out of your membership:

1. {{onboardingStep1}}
2. {{onboardingStep2}}
3. {{onboardingStep3}}

Questions? Reply to this email anytime — I read every one.

— {{creatorName}}`,
  }
];
```

**Discord DM Safety Rules (When Discord Integration is Connected):**
```javascript
const DISCORD_DM_RULES = {
  // Rate limits to stay well within Discord TOS
  max_dms_per_hour: 5,           // Conservative — Discord can flag bots at ~10/hr
  max_dms_per_day: 20,           // Well below detection threshold
  min_delay_between_dms_ms: 30000, // 30 seconds minimum between sends
  
  // Never send unsolicited DMs — only send to members who:
  require_prior_interaction: true,  // Have messaged in the server before
  require_dm_enabled: true,         // Have DMs from server members enabled
  
  // Fallback
  fallback_on_failure: "email",    // If DM fails/blocked, fall back to email
  
  // Content rules
  no_links_in_first_dm: true,      // First DM is always a personal check-in, no links
  identify_as_bot: false,          // Messages appear from the community bot, not pretending to be the creator
};
```

### 1.3 Technical Architecture

#### Whop App Architecture
```
┌─────────────────────────────────────────────────┐
│              Whop Platform                       │
│  ┌──────────────────────────────────────────┐   │
│  │  Creator Dashboard (Whop Admin)          │   │
│  │  ┌──────────────────────────────────┐    │   │
│  │  │  Grip iFrame App                │    │   │
│  │  │  (Next.js — renders inside Whop) │    │   │
│  │  │                                   │    │   │
│  │  │  • Risk scores                    │    │   │
│  │  │  • Member list                    │    │   │
│  │  │  • Playbook status                │    │   │
│  │  │  • Analytics                      │    │   │
│  │  └──────────────────────────────────┘    │   │
│  └──────────────────────────────────────────┘   │
│                    ▲                             │
│                    │ iFrame SDK                   │
│                    │ (auth, user context)         │
└────────────────────┼─────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│           Grip Backend                          │
│                                                   │
│  Next.js API Routes (Vercel)                     │
│  ├── /api/whop/webhook     ← Whop events         │
│  ├── /api/members          ← CRUD + risk scores  │
│  ├── /api/playbooks        ← Playbook engine      │
│  ├── /api/outreach         ← Email/DM sending     │
│  └── /api/analytics        ← Dashboard data       │
│                                                   │
│  Background Workers (Railway/Render)              │
│  ├── Risk score recalculation (every 6 hours)    │
│  ├── Playbook step execution (every 15 minutes)  │
│  ├── Whop data sync (every 4 hours)              │
│  └── Discord bot (optional, always-on)           │
│                                                   │
│  Database: PostgreSQL (Supabase)                  │
│  Cache: Redis (Upstash)                           │
│  Email: Resend / SendGrid                         │
│  AI: Anthropic Claude API (playbook personalization)│
└─────────────────────────────────────────────────┘
```

#### Database Schema
```sql
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
  
  -- App settings
  plan_tier VARCHAR DEFAULT 'free' CHECK (plan_tier IN ('free', 'growth', 'pro', 'enterprise')),
  member_count INT DEFAULT 0,
  settings JSONB DEFAULT '{
    "outreach_channel_priority": ["email", "whop_chat", "discord", "telegram"],
    "auto_enroll_playbooks": true,
    "daily_digest_email": true
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
  first_name VARCHAR,
  subscription_status VARCHAR NOT NULL, -- active, cancelled, past_due, trialing
  plan_id VARCHAR,
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
  
  -- Computed flags
  has_engagement_data BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(community_id, whop_membership_id)
);

CREATE INDEX idx_members_community ON members(community_id);
CREATE INDEX idx_members_status ON members(subscription_status);
CREATE INDEX idx_members_whop_user ON members(whop_user_id);

-- Engagement activity (from Layer 2/3/4 — optional)
CREATE TABLE member_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  source VARCHAR NOT NULL CHECK (source IN ('whop_chat', 'discord', 'telegram')),
  date DATE NOT NULL,
  messages_sent INT DEFAULT 0,
  reactions_given INT DEFAULT 0,
  reactions_received INT DEFAULT 0,
  channels_visited INT DEFAULT 0,
  voice_minutes INT DEFAULT 0,
  last_seen_at TIMESTAMP,
  engagement_score INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(member_id, source, date)
);

CREATE INDEX idx_activity_member_date ON member_activity(member_id, date DESC);

-- Risk scores (recalculated every 6 hours)
CREATE TABLE risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  score INT NOT NULL CHECK (score >= 0 AND score <= 100),
  risk_level VARCHAR NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_factors JSONB DEFAULT '[]'::jsonb,
  data_confidence VARCHAR DEFAULT 'medium' CHECK (data_confidence IN ('low', 'medium', 'high')),
  predicted_churn_date DATE,
  calculated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(member_id)  -- Only keep latest score per member
);

CREATE INDEX idx_risk_level ON risk_scores(risk_level, score DESC);

-- Outreach log (all channels)
CREATE TABLE outreach_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id),
  channel VARCHAR NOT NULL CHECK (channel IN ('email', 'whop_chat', 'discord_dm', 'telegram', 'manual')),
  template_id VARCHAR,
  playbook_enrollment_id UUID, -- NULL if manual send
  subject VARCHAR,
  content TEXT NOT NULL,
  
  -- Tracking
  sent_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  responded_at TIMESTAMP,
  bounced BOOLEAN DEFAULT false,
  
  -- Outcome
  outcome VARCHAR, -- re_engaged, no_response, unsubscribed, etc.
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_outreach_member ON outreach_log(member_id, sent_at DESC);
CREATE INDEX idx_outreach_playbook ON outreach_log(playbook_enrollment_id);

-- Playbook definitions
CREATE TABLE playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID REFERENCES communities(id),
  name VARCHAR NOT NULL,
  description TEXT,
  playbook_type VARCHAR NOT NULL CHECK (playbook_type IN ('system', 'custom')),
  trigger_conditions JSONB NOT NULL,
  steps JSONB NOT NULL,
  active BOOLEAN DEFAULT true,
  
  -- Performance tracking (hypotheses — updated as real data comes in)
  total_enrollments INT DEFAULT 0,
  total_completions INT DEFAULT 0,
  successful_outcomes INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Playbook enrollments (members currently in a playbook)
CREATE TABLE playbook_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID REFERENCES playbooks(id),
  member_id UUID REFERENCES members(id),
  current_step INT DEFAULT 0,
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'completed', 'stopped', 'failed')),
  enrolled_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  outcome VARCHAR, -- re_engaged, converted, no_response, etc.
  UNIQUE(playbook_id, member_id) -- One enrollment per playbook per member at a time
);

CREATE INDEX idx_enrollments_active ON playbook_enrollments(status) WHERE status = 'active';

-- Playbook step executions
CREATE TABLE playbook_step_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES playbook_enrollments(id),
  step_number INT NOT NULL,
  step_type VARCHAR NOT NULL,
  channel VARCHAR, -- email, whop_chat, discord_dm, telegram, creator_notification
  scheduled_for TIMESTAMP NOT NULL,
  executed_at TIMESTAMP,
  content TEXT,
  outcome JSONB, -- {opened: true, clicked: false, responded: true, etc.}
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
  event_type VARCHAR NOT NULL, -- member_joined, member_cancelled, payment_failed, playbook_started, etc.
  event_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_community ON events(community_id, created_at DESC);
```

#### Tech Stack
```
App Shell:
- Next.js 14 (App Router) + TypeScript
- Whop Apps SDK (@whop/sdk) for iFrame integration + API access
- Tailwind CSS + Shadcn UI
- Recharts (charts)

Backend:
- Next.js API routes (Vercel serverless)
- PostgreSQL (Supabase)
- Redis (Upstash — caching, rate limiting, job queues)
- BullMQ or Inngest (background job scheduling)

Outreach:
- Resend (email sending + tracking)
- Discord.js v14 (optional Discord bot)
- Telegraf (optional Telegram bot)

AI:
- Anthropic Claude API (playbook message personalization)

Hosting:
- Vercel (Next.js app + API)
- Railway or Render (Discord/Telegram bot workers — only if integration enabled)
- Supabase (database + auth)
- Upstash (Redis)

Monitoring:
- Sentry (error tracking)
- PostHog (product analytics)
```

### 1.4 Development Phases — Revised Timeline

#### Phase 1: MVP (Weeks 1-4) — Ship the "Risk Alert Engine"

**Week 1: Foundation + Whop Integration**
```
Tasks:
[ ] Create Whop developer app (get app ID + API key)
[ ] Initialize Next.js project with Whop Apps SDK
[ ] Set up Supabase + run migrations
[ ] Implement Whop iFrame authentication (user context, company context)
[ ] Fetch and sync member list from Whop API (memberships, plans, payments)
[ ] Store members in database
[ ] Set up webhook listener for Whop events (membership changes, payment events)
[ ] Deploy to Vercel

Deliverable: App installs on Whop, syncs member data, receives webhooks
```

**Week 2: Risk Scoring + Dashboard**
```
Tasks:
[ ] Implement subscription-based risk scoring (V1 — no engagement data needed)
[ ] Background job: recalculate risk scores every 6 hours
[ ] Build primary dashboard view (at-risk members list, sorted by risk)
[ ] Build member detail view (subscription info, risk factors)
[ ] Add summary cards (revenue at risk, critical count, high count)
[ ] Data source status indicator (show which integrations are connected)

Deliverable: Creator installs app → sees at-risk members with risk explanations within minutes
```

**Week 3: Email Outreach + Templates**
```
Tasks:
[ ] Integrate Resend for email sending
[ ] Build 4 email templates (check-in, renewal reminder, payment recovery, welcome)
[ ] One-click "Send Email" from member detail view
[ ] Template variable substitution (firstName, communityName, etc.)
[ ] Email open/click tracking
[ ] Outreach history log per member
[ ] Daily digest email to creator: "You have X critical-risk members"

Deliverable: Creator can send templated emails to at-risk members and track results
```

**Week 4: Polish + Beta Prep**
```
Tasks:
[ ] Loading/empty/error states
[ ] Settings page (outreach preferences, notification settings)
[ ] Basic analytics: members saved vs. churned this month
[ ] Whop app store listing (description, screenshots, pricing)
[ ] Onboarding flow (first-install experience)
[ ] Bug fixes, edge cases
[ ] Submit to Whop app review

Deliverable: Production-ready MVP for beta testing on Whop app store
```

#### Phase 2: Engagement Integrations (Weeks 5-7)

**Week 5: Discord Integration (Optional Add-On)**
```
Tasks:
[ ] Discord bot creation + OAuth install flow
[ ] Track messages, reactions, voice, last seen per member
[ ] Account linking (Whop user ID ↔ Discord user ID)
[ ] Store engagement data in member_activity table
[ ] Update risk scoring to include engagement data when available
[ ] Dashboard shows engagement charts for linked members

Deliverable: Creators who use Discord get richer risk predictions
```

**Week 6: Whop Chat + Telegram Integration**
```
Tasks:
[ ] Whop Chat activity tracking (if available via API/webhooks)
[ ] Telegram bot integration (optional)
[ ] Unified engagement score across all connected sources
[ ] "Connect your platforms" settings page
[ ] Confidence indicator: "Risk score accuracy: Medium → High" as integrations added

Deliverable: Full multi-platform engagement tracking
```

**Week 7: Beta Feedback + Iteration**
```
Tasks:
[ ] Collect feedback from 10-15 beta communities
[ ] Fix top 5 reported issues
[ ] Refine risk scoring based on real churn data vs. predictions
[ ] Add any quick-win features from feedback
[ ] Performance optimization

Deliverable: Validated MVP with real user feedback
```

#### Phase 3: Playbook Engine (Weeks 8-12)

**Week 8-9: Playbook Infrastructure**
```
Tasks:
[ ] Playbook enrollment system (trigger detection → auto-enroll)
[ ] Step execution engine (scheduled steps, conditional logic)
[ ] Channel-agnostic sending (email first → fallback to other channels)
[ ] AI personalization integration (Claude API for message generation)
[ ] Playbook dashboard view (active playbooks, enrollment counts, outcomes)

Deliverable: Playbook engine can execute multi-step sequences
```

**Week 10: First 3 Playbooks (Growth Tier)**
```
Tasks:
[ ] Playbook 1: Silent Member Revival
[ ] Playbook 2: New Member Fast Start
[ ] Playbook 3: Renewal Risk Mitigation
[ ] A/B testing framework (test message variants)
[ ] Outcome tracking per playbook

Deliverable: 3 working automated playbooks
```

**Week 11-12: Growth Tier Launch**
```
Tasks:
[ ] Playbook analytics (success rates, revenue saved)
[ ] Playbook configuration UI (toggle on/off, customize triggers)
[ ] Billing integration (free → Starter → Growth upgrade flow)
[ ] Documentation
[ ] Launch Starter tier ($49/month) and Growth tier ($149/month)

Deliverable: Starter + Growth tiers available on Whop app store
```

#### Phase 4: Advanced Playbooks + Pro Tier (Weeks 13-16)

**Weeks 13-14: Advanced Playbooks**
```
Tasks:
[ ] Playbook 4: Power User → VIP Conversion
[ ] Playbook 5: Win-Back Automation (post-cancellation)
[ ] Playbook 6: Upsell Opportunity Detection
[ ] Custom playbook builder (visual editor)

Deliverable: 6+ playbooks + custom builder
```

**Weeks 15-16: Pro Tier Launch**
```
Tasks:
[ ] Advanced A/B testing
[ ] Detailed playbook analytics
[ ] ROI calculator per playbook
[ ] Pro tier billing + launch ($299/month)

Deliverable: Pro tier available
```

#### Phase 5: Enterprise (Weeks 17-20)
```
Tasks:
[ ] Multi-community dashboard (manage 5-10 whops from one view)
[ ] White-label options
[ ] API access for custom integrations
[ ] Enterprise billing ($999/month)

Deliverable: Enterprise tier available
```

---

## Part 2: Automated Playbooks (Growth + Pro Tiers)

### 2.1 Why Playbooks Are the Product

The free tier (read-only risk scores) is a **hook**, not the product. Whop's built-in analytics already show creators basic churn data. What Whop doesn't do — and what no tool in this ecosystem does — is **automatically act on churn signals**. The free tier shows creators the problem; Starter lets them take manual action; Growth and Pro automate everything.

The playbook engine is the moat. It's hard to build, hard to replicate, and creates compounding value as it learns which interventions work for each community type.

**Hypothesis to validate in beta:**
- Manual outreach re-engagement rate: ~15-20% (industry baseline for creator communities)
- Automated playbook target: 2x improvement (30-40% re-engagement)
- Time saved target: 10-15 hours/week per creator
- Revenue saved target: $3K-10K/month for communities with 500+ members at $100+/month pricing

> ⚠️ **These are hypotheses, not proven metrics.** They will be updated with real data from beta testing. All marketing materials should use phrases like "targeting 2x improvement" not "achieves 68% re-engagement."

### 2.2 Channel-Agnostic Outreach Architecture

Every playbook step specifies a **message intent**, not a specific channel. The outreach engine selects the best available channel based on the creator's configured priority and the member's reachability.

```javascript
async function executePlaybookStep(step, member, community) {
  const channelPriority = community.settings.outreach_channel_priority;
  // Default: ["email", "whop_chat", "discord", "telegram"]
  
  for (const channel of channelPriority) {
    if (await canReachViaChannel(member, channel, community)) {
      try {
        const personalizedContent = step.ai_personalized
          ? await generatePersonalizedContent(step.template, member, community)
          : fillTemplate(step.template, member);
        
        const result = await sendMessage(channel, member, personalizedContent, step);
        
        await logOutreach({
          member_id: member.id,
          community_id: community.id,
          channel,
          content: personalizedContent,
          playbook_enrollment_id: step.enrollment_id,
        });
        
        return result;
      } catch (error) {
        console.warn(`[Outreach] ${channel} failed for ${member.id}, trying next channel`);
        continue; // Try next channel in priority
      }
    }
  }
  
  // All channels exhausted — notify creator
  await notifyCreator(community, {
    type: "outreach_failed",
    member,
    message: `Could not reach ${member.first_name} via any channel. Consider manual outreach.`,
  });
}

function canReachViaChannel(member, channel, community) {
  switch (channel) {
    case "email":
      return !!member.email;
    case "whop_chat":
      return community.whop_chat_enabled;
    case "discord":
      return community.discord_bot_installed && !!member.discord_user_id;
    case "telegram":
      return community.telegram_bot_installed && !!member.telegram_user_id;
    default:
      return false;
  }
}
```

### 2.3 Core Playbooks (Growth Tier — $149/month)

#### Playbook 1: Silent Member Revival

**Purpose:** Re-engage members who've gone quiet

**Trigger Conditions:**
- 7+ days without any activity (requires engagement integration)
- OR: Active subscription + approaching renewal + no engagement data (lower confidence trigger)
- Previous avg engagement > 30/100
- Subscription status: active
- Not currently enrolled in another playbook

**Sequence:**
```
DAY 1: Personalized Check-In
  Channel: Email (primary) or Whop Chat
  AI generates based on: member interests, recent community content
  Track: Opened, Clicked, Responded
  
  ├── If OPENED → continue to Day 2
  ├── If NOT OPENED after 24h → resend with different subject line
  └── If RESPONDED → mark as re-engaged, exit playbook ✅

DAY 3: Value Highlight
  Channel: Email
  Content: "Here's what you missed this week" — curated content digest
  Track: Opened, Clicked
  
  ├── If CLICKED → continue to Day 5 (engagement path)
  └── If NOT CLICKED → continue to Day 5 (escalation path)

DAY 5 (Engagement Path): Community Invitation
  Channel: Email or Whop Chat
  Content: Invite to upcoming event, Q&A, or discussion
  Track: RSVP, Attended
  
  └── If RSVP → mark as re-engaged, exit playbook ✅

DAY 5 (Escalation Path): Direct Question
  Channel: Email
  Content: "Quick question — is there something specific you'd like to see more of?"
  Track: Responded
  
  ├── If RESPONDED → route to creator for personal follow-up
  └── If NOT RESPONDED → continue to Day 7

DAY 7: Creator Notification
  Channel: Dashboard notification + email to creator
  Content: "{{memberName}} hasn't responded to 3 touchpoints. Revenue at risk: ${{planPrice}}/mo. 
            Recommended: Record a personal message or offer a discount."
  Creator action options: [Send personal message] [Offer discount] [Skip]

DAY 14: Last Resort (If Creator Chose Discount)
  Channel: Email
  Content: "Here's X% off your next month — my gift to you. Offer expires in 48 hours."
  Track: Accepted, Renewed, Cancelled

EXIT: Mark outcome (re_engaged / discount_offered / no_response / cancelled)
```

**Target Metrics (Hypothesis — To Be Validated):**
- Target re-engagement rate: 30-40% (vs. ~15% manual baseline)
- Target retention past next renewal: 25-35%
- Target time saved per community: 10+ hours/month
- Target revenue saved: $2K-6K/month for a 500-member community

---

#### Playbook 2: New Member Fast Start

**Purpose:** Maximize first-month retention through guided onboarding

**Trigger:** Member joins (subscription status → active), within first 24 hours

**Sequence:**
```
HOUR 1: Welcome Email
  Content: Personalized welcome + quick-start guide
  Include: Top 3 things to do first (customized per community type)
  Track: Opened, Clicked

DAY 1: Goal Setting
  Content: "What's your #1 goal?" — link to quick survey/form
  Track: Survey completed (Y/N)
  If completed → personalize remaining sequence based on answers

DAY 3: Progress Check
  If engaged (posted in community, watched content, etc.):
    → "Great start! Here's what to tackle next"
  If NOT engaged:
    → "Need help getting started? Here's the easiest first step: [specific link]"

DAY 7: Milestone or Nudge
  If completed onboarding milestones:
    → Celebrate with stats ("You watched 4 videos, posted 8 times this week!")
  If NOT:
    → Gentle nudge with simplified getting-started steps

DAY 14: Value Check
  Content: "On a scale 1-10, how's your first 2 weeks?"
  If 1-6 → Immediate escalation to creator
  If 7-10 → Ask for testimonial/review

DAY 25: Pre-Renewal Prep (5 days before first renewal)
  Content: Summary of what they've accomplished + preview of month 2
  Include: Annual plan offer if available (save X% by committing)
  Track: Upgraded to annual (Y/N), Renewed (Y/N)
```

**Target Metrics (Hypothesis):**
- Target onboarding completion: 50-60% (vs. ~30% without guidance)
- Target first-month retention: 60-70% (vs. ~45% without)
- Target annual upgrade rate: 15-20% (vs. ~5% without offer)

---

#### Playbook 3: Renewal Risk Mitigation

**Purpose:** Prevent cancellations around renewal dates for at-risk members

**Trigger:** 10 days before renewal + risk score > 40

**Sequence:**
```
DAY -10: Value Reminder
  Content: "Here's what you got this month" — personalized content digest
  Highlight: Specific content/wins relevant to this member
  Track: Opened, Clicked

DAY -7: Satisfaction Check
  Content: "How's your experience? [Great / Could be better / Not great]"
  If positive → Preview next month's content
  If neutral → Ask what's missing, offer solutions
  If negative → Immediate creator escalation

DAY -5: Address Concerns (if raised)
  AI-generated response based on concern type:
  - "Too expensive" → Discount or downgrade option
  - "Not enough value" → Curated content recommendations + feature they haven't tried
  - "No time" → Digest/summary mode suggestion if available

DAY -3: ROI Showcase (for high-LTV members)
  Content: Personalized value summary
  (Only if creator tracks wins/results — e.g., trading signals, course completions)

DAY -1: Final Push + Offer (if still at risk)
  Content: Annual plan discount or loyalty bonus
  Track: Accepted, Renewed, Cancelled

DAY 0: Payment Failure Recovery (if payment fails)
  Automated sequence: 3 emails over 72 hours
  Content: Payment update link + urgency messaging
  Track: Payment updated (Y/N), Recovered (Y/N)
```

**Target Metrics (Hypothesis):**
- Target save rate for at-risk members: 25-35% (vs. ~8% without intervention)
- Target payment failure recovery: 50-60% (vs. ~20% manual)
- Target annual upgrade acceptance: 15-20%

---

### 2.4 Advanced Playbooks (Pro Tier — $299/month)

#### Playbook 4: Power User → VIP Conversion
```
Trigger: Engagement score > 80 for 30+ consecutive days, tenure > 60 days
Goal: Convert top members to premium/VIP tier
Sequence: Recognition → VIP intro → Benefits → Social proof → Trial offer
Target conversion rate: 15-20% to premium tier
```

#### Playbook 5: Win-Back Automation
```
Trigger: Subscription cancelled within last 90 days
Goal: Re-activate cancelled members with segmented offers
Sequence: Varies by cancellation reason (too expensive / not enough value / no time)
Target re-activation rate: 10-15%
```

#### Playbook 6: Upsell Opportunity Detection
```
Trigger: Behavioral patterns (high engagement, frequent questions, content consumption)
Goal: Identify and execute cross-sell/upsell opportunities
Types: Coaching upsell, masterclass upsell, premium tier upgrade
Target conversion rate: 10-20% depending on offer type
```

#### Custom Playbook Builder (Pro Tier)
- Visual editor: drag-and-drop steps, conditional logic, delay timers
- Template library: pre-built step templates creators can customize
- Test mode: preview entire sequence before activating
- Clone system playbooks and modify for their specific community

### 2.5 Playbook System Configuration

```javascript
const playbookConfig = {
  name: "Silent Member Revival",
  description: "Re-engage members who've gone quiet for 7+ days",
  
  trigger: {
    conditions: [
      { field: "days_since_last_activity", operator: ">=", value: 7, requires_engagement_data: true },
      { field: "subscription_status", operator: "==", value: "active" },
      { field: "avg_engagement_score", operator: ">", value: 30, requires_engagement_data: true },
    ],
    // Alternative trigger if no engagement data
    fallback_conditions: [
      { field: "subscription_status", operator: "==", value: "active" },
      { field: "days_until_renewal", operator: "<=", value: 14 },
      { field: "has_engagement_data", operator: "==", value: false },
    ],
    logic: "AND",
    cooldown_days: 60, // Don't re-enroll same member within 60 days
  },
  
  steps: [
    {
      step: 1,
      delay_days: 0,
      type: "message",
      channel: "auto", // Uses channel priority from community settings
      ai_personalized: true,
      template: "Hey {{firstName}}! Been a minute since I saw you around {{communityName}}. We had some great {{contentType}} this week — thought you'd enjoy {{recentHighlight}}. Everything good?",
      context_needed: ["first_name", "recent_community_content", "member_interests"],
      track: ["opened", "clicked", "responded"],
      
      on_responded: "mark_success",
      on_opened: { next_step: 2, delay_days: 2 },
      on_no_action: { next_step: 2, delay_days: 2, resend_with_new_subject: true },
    },
    {
      step: 2,
      delay_days: 2,
      type: "message",
      channel: "auto",
      ai_personalized: true,
      template: "{{firstName}}, here's what you missed this week in {{communityName}}: {{weeklyDigest}}",
      track: ["opened", "clicked"],
      
      on_clicked: { next_step: 3, delay_days: 2, path: "engagement" },
      on_no_action: { next_step: 3, delay_days: 2, path: "escalation" },
    },
    {
      step: 3,
      delay_days: 2,
      type: "message",
      channel: "auto",
      variants: {
        engagement: {
          template: "Great to see you checking things out! We've got {{upcomingEvent}} this week — want in?"
        },
        escalation: {
          template: "Quick question {{firstName}} — is there something specific you'd like to see more of in {{communityName}}? Your feedback genuinely helps."
        }
      },
      track: ["responded"],
      
      on_responded: "route_to_creator",
      on_no_action: { next_step: 4, delay_days: 2 },
    },
    {
      step: 4,
      delay_days: 2,
      type: "creator_notification",
      priority: "high",
      message: "{{memberName}} hasn't responded to 3 outreach attempts. Revenue at risk: ${{planPrice}}/month (LTV: ${{ltv}}). Recommended: send a personal message or offer a retention discount.",
      creator_actions: ["send_personal_message", "offer_discount", "skip"],
      
      on_creator_action: {
        send_personal_message: "wait_for_creator_message",
        offer_discount: { next_step: 5, delay_days: 0 },
        skip: "mark_completed_no_success",
      },
    },
    {
      step: 5,
      delay_days: 0,
      type: "message",
      channel: "email",
      template: "{{firstName}}, I want to make sure you're getting value. Here's {{discountPercent}}% off your next month — offer expires in 48 hours. {{discountLink}}",
      track: ["accepted", "renewed"],
      
      on_accepted: "mark_success",
      on_no_action: { delay_days: 3, action: "mark_completed_no_success" },
    },
  ],
  
  success_criteria: {
    re_engaged: "member posts or responds to any outreach",
    converted: "accepted discount offer and renewed",
    partial: "opened/clicked any message but didn't respond",
    no_response: "no engagement with any step",
  },
};
```

### 2.6 Background Job Processing

```javascript
// Runs every 15 minutes
async function processPlaybooks() {
  // 1. Check for new playbook triggers → auto-enroll eligible members
  await enrollNewMembers();
  
  // 2. Execute scheduled steps that are due
  await executeScheduledSteps();
  
  // 3. Check outcomes of recently executed steps → advance or complete playbooks
  await advancePlaybooks();
}

async function enrollNewMembers() {
  // Only process communities on paid tiers (growth, pro, enterprise)
  const communities = await db.communities.findMany({
    where: { plan_tier: { in: ['growth', 'pro', 'enterprise'] } }
  });
  
  for (const community of communities) {
    if (!community.settings.auto_enroll_playbooks) continue;
    
    const activePlaybooks = await db.playbooks.findMany({
      where: { community_id: community.id, active: true }
    });
    
    for (const playbook of activePlaybooks) {
      const candidates = await findMatchingMembers(playbook.trigger_conditions, community.id);
      
      for (const member of candidates) {
        // Check cooldown period
        const recentEnrollment = await db.playbook_enrollments.findFirst({
          where: {
            playbook_id: playbook.id,
            member_id: member.id,
            enrolled_at: { 
              gte: new Date(Date.now() - playbook.trigger_conditions.cooldown_days * 86400000) 
            }
          }
        });
        
        // Check member isn't in another active playbook
        const activeEnrollment = await db.playbook_enrollments.findFirst({
          where: { member_id: member.id, status: 'active' }
        });
        
        if (!recentEnrollment && !activeEnrollment) {
          await db.playbook_enrollments.create({
            data: {
              playbook_id: playbook.id,
              member_id: member.id,
              status: 'active',
              current_step: 0,
            }
          });
          
          // Schedule first step
          await scheduleStep(playbook.steps[0], member, new Date());
        }
      }
    }
  }
}

async function executeScheduledSteps() {
  const dueSteps = await db.playbook_step_executions.findMany({
    where: {
      scheduled_for: { lte: new Date() },
      executed_at: null,
    },
    include: {
      enrollment: { include: { playbook: true, member: true } }
    },
    orderBy: { scheduled_for: 'asc' },
    take: 50, // Process in batches
  });
  
  for (const stepExec of dueSteps) {
    try {
      const { enrollment } = stepExec;
      const step = enrollment.playbook.steps[stepExec.step_number];
      const community = await db.communities.findUnique({ 
        where: { id: enrollment.member.community_id } 
      });
      
      if (step.type === 'message') {
        await executePlaybookStep(step, enrollment.member, community);
      } else if (step.type === 'creator_notification') {
        await notifyCreator(community, {
          type: 'playbook_action_required',
          member: enrollment.member,
          playbook: enrollment.playbook.name,
          message: fillTemplate(step.message, enrollment.member),
          actions: step.creator_actions,
        });
      }
      
      await db.playbook_step_executions.update({
        where: { id: stepExec.id },
        data: { executed_at: new Date() }
      });
      
    } catch (error) {
      console.error(`[Playbooks] Step execution failed:`, error);
      await db.playbook_step_executions.update({
        where: { id: stepExec.id },
        data: { executed_at: new Date(), error: error.message }
      });
    }
  }
}

async function generatePersonalizedContent(template, member, community) {
  // Gather context from available data
  const context = {
    firstName: member.first_name || "there",
    communityName: community.name,
    planPrice: (member.plan_price_cents / 100).toFixed(0),
    tenureDays: member.tenure_days,
    ltv: (member.ltv_cents / 100).toFixed(0),
  };
  
  // Enrich with engagement data if available
  if (member.has_engagement_data) {
    const recentContent = await getRecentCommunityHighlights(community.id);
    context.recentHighlight = recentContent[0]?.title || "some great content";
    context.contentType = recentContent[0]?.type || "content";
  }
  
  const prompt = `Generate a personalized message using this template and context.
    
Template: "${template}"
Context: ${JSON.stringify(context)}

Rules:
- Natural, conversational tone. Write like a real person, not a marketing bot.
- Under 80 words for DMs, under 150 words for emails.
- Specific to this member where possible.
- Do NOT use excessive emojis or exclamation marks.
- Output only the message text, nothing else.`;
  
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }]
  });
  
  return response.content[0].text;
}
```

---

## Part 3: Pricing & Packaging

### Pricing Tiers (Revised)

**Free Tier — $0/month**
- Up to 50 members
- Risk scores (subscription-data-only — Whop API)
- Member list with risk level indicators
- Read-only dashboard — no outreach, no playbooks, no email templates
- **Purpose:** Let creators SEE the churn problem (at-risk members, revenue at risk) but not ACT on it. Creates natural urgency to upgrade.
- **Target:** Small communities just getting started, or creators evaluating the tool

**Starter — $49/month** 🚀
- Up to 500 members
- Everything in Free
- 1 automated playbook (New Member Fast Start — highest-impact for small communities)
- 4 email templates (manual send)
- Unlimited manual emails
- Discord integration (optional)
- Email support
- **Purpose:** Bridge from free to paid. One playbook proves the concept; manual emails let creators take action on risk scores. Low enough price to be an impulse decision ("save one member and it pays for itself").
- **Target:** Small-to-medium communities (200-500 members) testing retention automation

**Growth — $149/month** ⭐ (Primary Revenue Driver)
- Up to 2,000 members
- Everything in Starter
- 3 automated playbooks (Silent Revival, New Member Fast Start, Renewal Risk)
- Telegram integration (optional)
- AI message personalization
- Basic A/B testing
- Unlimited automated outreach
- Email + chat support
- **Target:** Growing communities (500-2,000 members) with 20%+ churn

**Pro — $299/month** 💎
- Unlimited members
- Everything in Growth
- All 6+ system playbooks (including VIP conversion, Win-Back, Upsell)
- Custom playbook builder
- Advanced A/B testing
- Detailed analytics + ROI tracking
- API access (basic)
- Priority support
- **Target:** Established communities (1,000-5,000 members)

**Enterprise — $999/month** 🏢
- Everything in Pro
- Multi-community management (up to 10 whops)
- White-label branding (remove Grip branding)
- Custom playbook consulting (2 hours/month)
- Dedicated success manager
- Custom integrations
- SLA guarantee
- **Target:** Agencies, multi-community operators

### Why This Pricing Works

**Free is a read-only hook:** Free tier shows creators exactly how much revenue is at risk (the problem) but gives them zero tools to fix it. Every time they log in, they see "23 at-risk members, $8,400 revenue at risk" with no way to reach those members. The upgrade friction is psychological, not financial — they already know the problem exists.

**Free → Starter ($0 → $49) is an impulse decision:** At $49/month, a creator with 200 members at $50/month only needs to save ONE member per month to break even. The New Member Fast Start playbook alone typically prevents 3-5 first-month cancellations. This step exists specifically to reduce the $0 → $149 psychological jump.

**Starter → Growth ($49 → $149) is a natural upgrade:** Once creators see one playbook working, they want more. The upgrade pitch writes itself: "New Member Fast Start saved 4 members this month. Imagine what 3 playbooks running simultaneously would do." They're already paying, already trust the product, and have data proving ROI.

**Growth is the sweet spot:** At $149/month, a creator with 1,000 members at $100/month only needs to save ONE member per month to 1.5x their investment. Most communities will save 5-15 members/month, making this a 10-50x ROI.

**Pro justification:** Custom playbooks + VIP conversion + win-back automation. A community that converts just 2 members to a $500 VIP tier per quarter more than covers the cost.

**Enterprise ceiling:** Agencies managing 5-10 communities are saving $20K-50K/month across their portfolio. $999 is nothing.

### Free Trial
- 14-day free trial of Growth tier (no credit card required) — available to both Free and Starter users
- Full playbook access during trial
- Conversion emails at day 3, 7, 10, 13
- Show "revenue saved" counter prominently during trial
- Post-trial: downgrade to previous tier (Free or Starter)

---

## Part 4: Go-to-Market Strategy

### 4.1 Distribution (Whop App Store First)

**Primary: Whop App Store**
- Listed as a Whop-native app
- Optimized app store listing with screenshots, demo video, social proof
- Target: category-specific discovery (retention, analytics, community management)
- Whop marketplace gets 4M+ unique monthly visitors
- This is zero-CAC organic distribution

**Secondary: Direct Outreach to Top Whop Creators**
- Target the top 200 revenue-generating Whop communities
- Personalized outreach: "Your community does $X/month. Based on typical churn rates, you're losing ~$Y/month. Here's how Grip saves that."
- Demo calls → free trial → conversion
- Target: 10-15% conversion rate

**Tertiary: Content Marketing**
- Blog: "How to Reduce Churn in Whop Communities" (SEO play)
- Twitter/X: Share anonymized retention wins, case studies
- YouTube: Product demos, "how I saved $X in churn" creator stories
- Whop community forums/discussions

### 4.2 Beta Program (Weeks 4-7)

**Objective:** Validate risk scoring accuracy, test playbook effectiveness, gather real data

**Target:** 10-15 beta communities (mix of niches and sizes)

**Selection Criteria:**
- 200-2,000 members on Whop
- Known churn problem (creator acknowledges it)
- Responsive creator (willing to give weekly feedback)
- Mix: 5 trading, 3 betting/sports, 3 fitness/education, 2 other

**Offer:** Free Growth tier access for 3 months + input on feature roadmap

**What We're Validating:**
1. Does Whop-API-only risk scoring identify at-risk members before they cancel? (Target: 60%+ accuracy)
2. Does adding Discord/Telegram data improve accuracy? (Target: 75%+ with engagement data)
3. Do automated playbooks outperform manual outreach? (Target: 2x improvement)
4. What's the actual time saved for creators? (Target: 10+ hours/month)
5. What's the actual revenue saved? (Target: $2K-10K/month per community)

**Deliverables from Beta:**
- Real accuracy/performance data to replace hypothetical metrics
- 3-5 detailed case studies with specific numbers
- 10+ testimonials
- Validated pricing (survey beta partners on willingness to pay)
- Refined playbook sequences based on what actually works

### 4.3 Launch Strategy (Month 3)

**Pre-Launch (2 weeks before):**
- Whop app store listing finalized
- Landing page with case studies and real beta data
- Demo video (3-4 minutes)
- Launch announcement scheduled for relevant communities

**Launch Week:**
- Whop app store goes live
- Announce in Whop creator communities
- DM top 50 Whop creators with personalized pitch
- Post case studies on Twitter/X
- Target: 20-30 paying customers by end of launch week

### 4.4 Customer Acquisition Projections (Revised — Conservative)

**Addressable Market Reality Check:**
- ~183K sellers on Whop, but only ~889 products generate $10K+/month
- Our target: communities with 200+ members AND $5K+/month revenue (willing to pay $49-299/month for retention)
- $49 Starter tier opens up a wider market of smaller communities that wouldn't pay $149+
- Estimated addressable market on Whop alone: ~3,000-5,000 communities (including Starter-tier targets)
- Need to expand beyond Whop (general Discord communities, other platforms) by Month 6-9

**Month 1-2:** Beta (15 communities, free)
**Month 3:** Launch — 25 paying customers
**Month 4:** 40 customers (+60% growth)
**Month 6:** 60-80 customers
**Month 9:** 100-130 customers (start targeting non-Whop communities)
**Month 12:** 150-200 customers

**Revenue:**
- Avg. $155/customer (weighted mix: 25% Starter, 35% Growth, 25% Pro, 10% Free, 5% Enterprise)
- Month 6: 70 × $155 = $10.9K MRR
- Month 12: 175 × $155 = $27.1K MRR ($325K ARR)
- Note: Avg revenue per customer likely increases over time as Starter users upgrade to Growth/Pro

---

## Part 5: Success Metrics & KPIs

### Product Metrics

**Activation:**
- App install → first risk score viewed: < 5 minutes (target)
- Free → Growth conversion: 15%+ within 30 days
- Trial → paid conversion: 25%+

**Effectiveness (To Be Validated in Beta):**
- Churn prediction accuracy (Whop-API-only): target 60%+
- Churn prediction accuracy (with engagement data): target 75%+
- Playbook re-engagement rate: target 2x manual baseline
- Payment failure recovery: target 50%+

**Engagement:**
- Weekly active creators (dashboard views): 70%+
- Avg. playbook interventions triggered/month: 30+

**Performance:**
- Dashboard load time: < 2 seconds
- Playbook execution reliability: 99.5%+

### Business Metrics

**Growth:**
- MRR Growth Rate: 25%+ monthly (first 6 months)
- Month 12 target: $30K MRR (conservative)

**Economics:**
- CAC: < $200 (organic-first via Whop app store)
- LTV: $2,000+ (12-month avg at $180/month avg, 11-month lifespan)
- LTV:CAC: 10:1+
- Gross Margin: 85%+

**Retention (Our Own):**
- Logo churn: < 5% monthly
- Net revenue retention: 110%+ (upsells from Growth → Pro)

---

## Part 6: Team, Operations & Costs

### Founding Team (2 Developers)

**Developer 1:**
- Next.js app + Whop iFrame integration
- Dashboard UI + frontend
- Whop API integration
- Deployment + DevOps

**Developer 2:**
- Background jobs (risk scoring, playbook engine)
- Email outreach system (Resend integration)
- Discord/Telegram bots (optional integrations)
- AI personalization (Claude API)

**Shared:** Product decisions, beta management, customer support

### Hiring Plan

**Month 6 ($10K+ MRR):** VA/Support ($2K/month)
**Month 9 ($20K+ MRR):** Customer Success Manager ($4-6K/month)
**Month 12 ($30K+ MRR):** Marketing/Growth Lead ($5-8K/month)

### Monthly Costs

**Months 1-3 (Building + Beta): ~$120/month**
- Supabase Pro: $25
- Vercel Pro: $20
- Upstash Redis: $10
- Resend (email): $0 (free tier, 3K emails/month)
- Railway (workers): $5-20
- Domain + misc: $15
- Anthropic API: ~$20-30

**Months 4-6 (Post-Launch): ~$400-800/month**
- Above + scaled usage
- Resend Pro: $20/month
- Anthropic API: ~$100-200
- Sentry: $26
- PostHog: $0 (free tier)

**Months 7-12 (Growth): ~$2,000-3,000/month**
- Above + scaled infrastructure
- Marketing: $1,000-1,500
- Support tooling: $100-200

---

## Part 7: Risk Analysis & Mitigation (Revised)

### Critical Risks

**Risk 1: Whop Builds Retention Features Natively**
- **Probability:** Medium-High (they're already improving analytics)
- **Impact:** High (could commoditize our Free/Starter tier)
- **Mitigation:**
  - Our moat is the **playbook engine**, not the dashboard — Whop is unlikely to build multi-step conditional automation
  - Move fast to establish category leadership and switching costs
  - Build deep integrations (Discord, Telegram, email) that go beyond what a native Whop feature would
  - Position for acquisition: if Whop wants this, they buy us
- **Contingency:**
  - Expand beyond Whop to general Discord/Telegram communities
  - Differentiate on playbook sophistication and AI personalization

**Risk 2: Discord TOS / Rate Limiting**
- **Probability:** Medium (if we're not careful)
- **Impact:** High (bot banned = lose Discord integration)
- **Mitigation:**
  - Email-first architecture — Discord DMs are never the only channel
  - Conservative rate limits (5 DMs/hour, 20/day max)
  - Never send unsolicited DMs to members who haven't interacted
  - Monitor Discord developer announcements closely
- **Contingency:**
  - Discord integration is optional, not core — product works without it
  - Shift to Whop Chat + email only

**Risk 3: Low Creator Adoption**
- **Probability:** Medium
- **Impact:** Critical
- **Mitigation:**
  - Free tier lowers barrier to zero
  - Whop app store provides organic discovery
  - Clear ROI story backed by real beta data (not hypothetical metrics)
  - Focus on top 200 Whop creators first (high-value, high-churn)
- **Contingency:**
  - Expand to non-Whop communities (general Discord, Skool, Circle)
  - Pivot to specific vertical (trading-only retention tool)

**Risk 4: Whop API Changes / Limitations**
- **Probability:** Medium
- **Impact:** High
- **Mitigation:**
  - Abstraction layer over Whop SDK (easy to adapt to API changes)
  - Maintain relationship with Whop developer relations team
  - Monitor Whop's developer changelog and Discord
  - Store data locally (not solely dependent on real-time API calls)
- **Contingency:**
  - Multi-platform architecture allows pivoting to other platforms

**Risk 5: Churn Prediction Accuracy (Without Engagement Data)**
- **Probability:** Medium (Whop-API-only risk scores are limited)
- **Impact:** Medium (affects credibility of Free tier)
- **Mitigation:**
  - Honest positioning: "subscription risk alerts" not "churn prediction" on Free tier
  - Strongly encourage Discord/Chat integration for better accuracy
  - Show confidence indicator: "Risk accuracy: Medium (connect Discord for High)"
  - Use beta data to calibrate and improve scoring weights
- **Contingency:**
  - Reframe Free tier as "churn awareness" not "prediction"
  - Make engagement integration a soft-requirement for Growth tier

**Risk 6: Small Addressable Market on Whop Alone**
- **Probability:** High (only ~3K-5K qualifying communities including Starter-tier targets)
- **Impact:** Medium (caps growth at ~$50-60K MRR if Whop-only)
- **Mitigation:**
  - Plan for multi-platform expansion by Month 9 (general Discord, Skool, Circle)
  - Build platform-agnostic playbook engine from day 1
  - Use Whop as launchpad, not final destination
- **Contingency:**
  - Rebrand from "Whop retention tool" to "community retention platform"
  - Target Skool (growing competitor), Circle, Mighty Networks

---

## Part 8: Exit Strategy & Long-Term Vision

### Potential Exit Scenarios

**Scenario 1: Acquisition by Whop**
- Timeline: 12-24 months
- Rationale: Native retention feature for the platform
- Likelihood: Medium-High if we reach 100+ Whop customers and prove playbook value

**Scenario 2: Bootstrap to Cash Flow**
- Timeline: Ongoing
- Target: $50K+ MRR by Month 18, expand beyond Whop
- Most realistic and most in our control

**Scenario 3: Acquisition by Community Platform (Circle, Mighty, etc.)**
- Timeline: 24-36 months
- Requires: Multi-platform version + proven results
- Likelihood: Medium

**Scenario 4: VC-Backed Scale (if warranted)**
- Timeline: Raise at Month 12-18 if growth metrics justify it
- Requires: Strong MRR growth + multi-platform expansion plan

### Long-Term Vision (2-3 Years)

**Phase 1 (Months 1-12):** Whop-native retention playbook engine
**Phase 2 (Months 9-18):** Expand to general Discord communities + Telegram communities
**Phase 3 (Months 15-24):** Integrate with Skool, Circle, Mighty Networks
**Phase 4 (Months 18-30):** Become the platform-agnostic "community retention OS"

**Expansion Opportunities:**
1. Platform expansion: Skool, Circle, Mighty Networks, Slack
2. Playbook marketplace: Creators share/sell proven retention playbooks
3. Vertical specialization: Trading-specific, fitness-specific features
4. Revenue optimization: Not just retention, but growth (upsell/cross-sell automation)
5. Content intelligence: Recommend what content to create based on what retains members

---

## Conclusion

**What we're building:** The first automated retention playbook engine for creator communities, distributed natively through Whop's app ecosystem.

**Why this, why now:**
- Whop has 183K+ sellers and $60M+/month in GMV, but limited analytics and zero retention automation
- Trading and fitness verticals (Whop's biggest categories) have the highest churn AND the highest subscription prices — maximum pain, maximum willingness to pay
- No existing tool combines churn prediction + automated multi-step interventions for this market

**Core insight:** The dashboard is the hook. The playbook engine is the product. Analytics show you who's leaving. Playbooks stop them.

**Path to $27K MRR:**
- Weeks 1-4: Build MVP (risk alerts + manual email outreach)
- Weeks 5-7: Beta with 15 communities (validate everything)
- Week 8-12: Launch + build playbook engine (Starter + Growth tiers)
- Month 6: 60-80 customers, $11K MRR
- Month 12: 150-200 customers, $27K+ MRR (avg revenue per customer increases as Starter users upgrade)

**Next Steps:**
1. Create Whop developer account + app registration
2. Complete 15-20 creator validation conversations
3. Secure 10 beta partners
4. Build MVP (4 weeks)
5. Beta test (3 weeks)
6. Launch on Whop app store

---

**Document Version:** 2.0
**Last Updated:** February 26, 2026
**Status:** Pre-Development — Ready to Build
**Next Review:** End of Week 4 (MVP Complete)
