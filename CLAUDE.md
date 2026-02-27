# CLAUDE.md — Grip: Retention Engine for Whop Communities

## What This Is

Grip is a Whop-native app that detects at-risk community members and executes automated retention playbooks to prevent cancellations. It renders inside a Whop creator's dashboard via iFrame.

**Core loop:** Whop API data → Risk scoring → Automated multi-step email/chat interventions → Track outcomes → Show ROI

**What we are NOT building:** A standalone SaaS dashboard. This is a Whop app that lives inside Whop's ecosystem.

---

## Tech Stack

```
Framework:      Next.js 14+ (App Router) + TypeScript
Whop SDK:       @whop-apps/sdk (iFrame integration, auth, API access)
Styling:        Tailwind CSS + custom design system (see Design Reference below)
Charts:         Recharts
Database:       PostgreSQL via Supabase (@supabase/supabase-js)
Cache:          Redis via Upstash (@upstash/redis)
Jobs:           Inngest (background job scheduling — risk recalc, playbook steps, data sync)
Email:          Resend (sending + open/click tracking)
AI:             Anthropic Claude API (playbook message personalization)
Hosting:        Vercel
Fonts:          Outfit (headings/numbers), Plus Jakarta Sans (body)
```

---

## Project Structure

```
grip/
├── CLAUDE.md                          # This file
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .env.local                         # See Environment Variables section
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql     # Database schema (see below)
│
├── design-reference/
│   └── grip-prototype.tsx             # UI-only design mockup (VISUAL TARGET — see below)
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout with fonts, Whop SDK provider
│   │   ├── page.tsx                   # Main app shell (iFrame entry point)
│   │   │
│   │   ├── api/
│   │   │   ├── whop/
│   │   │   │   └── webhook/
│   │   │   │       └── route.ts       # Whop webhook handler (membership changes, payments)
│   │   │   ├── members/
│   │   │   │   ├── route.ts           # GET: list members with risk scores + filters
│   │   │   │   ├── [id]/
│   │   │   │   │   └── route.ts       # GET: member detail, PUT: update
│   │   │   │   └── sync/
│   │   │   │       └── route.ts       # POST: trigger manual Whop data sync
│   │   │   ├── risk/
│   │   │   │   └── recalculate/
│   │   │   │       └── route.ts       # POST: trigger risk score recalculation
│   │   │   ├── playbooks/
│   │   │   │   ├── route.ts           # GET: list playbooks, POST: create
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── route.ts       # GET/PUT/DELETE playbook
│   │   │   │   │   └── enroll/
│   │   │   │   │       └── route.ts   # POST: enroll member in playbook
│   │   │   │   └── execute/
│   │   │   │       └── route.ts       # POST: execute pending playbook steps
│   │   │   ├── outreach/
│   │   │   │   ├── route.ts           # POST: send email/message to member
│   │   │   │   └── templates/
│   │   │   │       └── route.ts       # GET: email templates
│   │   │   ├── analytics/
│   │   │   │   └── route.ts           # GET: dashboard analytics data
│   │   │   └── inngest/
│   │   │       └── route.ts           # Inngest function handler
│   │   │
│   │   └── (screens)/                 # App screens (rendered in iFrame)
│   │       ├── dashboard/
│   │       │   └── page.tsx
│   │       ├── members/
│   │       │   └── [id]/
│   │       │       └── page.tsx
│   │       ├── playbooks/
│   │       │   ├── page.tsx
│   │       │   └── [id]/
│   │       │       └── page.tsx
│   │       ├── analytics/
│   │       │   └── page.tsx
│   │       └── settings/
│   │           └── page.tsx
│   │
│   ├── components/
│   │   ├── ui/                        # Reusable UI primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── StatBlock.tsx
│   │   │   ├── RiskPill.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── Toggle.tsx
│   │   │   ├── Pill.tsx
│   │   │   └── EngagementChart.tsx
│   │   ├── layout/
│   │   │   ├── TopNav.tsx             # Sticky top nav (logo, community picker, theme toggle)
│   │   │   ├── TabBar.tsx             # Dashboard/Playbooks/Analytics/Settings tabs
│   │   │   └── Footer.tsx
│   │   ├── dashboard/
│   │   │   ├── StatsRow.tsx           # Revenue at risk, critical count, etc.
│   │   │   ├── DataSourcesBar.tsx     # Whop API ✓, Discord ✓, Telegram ✗
│   │   │   ├── MemberFilters.tsx      # All / Critical / High / Medium / Low
│   │   │   └── MemberList.tsx         # Sortable member rows
│   │   ├── members/
│   │   │   ├── MemberDetail.tsx       # Full member profile
│   │   │   ├── SubscriptionCard.tsx
│   │   │   ├── RiskFactorsCard.tsx
│   │   │   ├── EngagementCard.tsx
│   │   │   └── PlaybookHistoryCard.tsx
│   │   ├── playbooks/
│   │   │   ├── PlaybookCard.tsx       # Playbook summary with funnel bars
│   │   │   ├── PlaybookDetail.tsx     # Step funnel + activity log
│   │   │   └── StepFunnel.tsx
│   │   ├── UpgradePrompt.tsx          # Shown when free tier user tries gated action
│   │   └── GripLogo.tsx
│   │
│   ├── lib/
│   │   ├── whop.ts                    # Whop SDK client initialization
│   │   ├── supabase.ts                # Supabase client (server + client)
│   │   ├── redis.ts                   # Upstash Redis client
│   │   ├── resend.ts                  # Resend email client
│   │   ├── ai.ts                      # Claude API client for personalization
│   │   ├── risk-scoring.ts            # Risk score calculation engine
│   │   ├── playbook-engine.ts         # Playbook step execution logic
│   │   ├── outreach.ts                # Channel-agnostic message sending
│   │   ├── plan-limits.ts             # Tier definitions and feature gating
│   │   ├── sync.ts                    # Whop data sync logic
│   │   └── utils.ts                   # Formatting, date helpers
│   │
│   ├── inngest/
│   │   ├── client.ts                  # Inngest client
│   │   └── functions/
│   │       ├── recalculate-risk.ts    # Cron: every 6 hours
│   │       ├── execute-playbook-steps.ts  # Cron: every 15 minutes
│   │       ├── sync-whop-data.ts      # Cron: every 4 hours
│   │       └── daily-digest.ts        # Cron: 8am creator timezone
│   │
│   ├── hooks/
│   │   ├── useMembers.ts
│   │   ├── usePlaybooks.ts
│   │   ├── useAnalytics.ts
│   │   └── useTheme.ts
│   │
│   └── types/
│       ├── member.ts
│       ├── playbook.ts
│       ├── risk.ts
│       └── community.ts
```

---

## Environment Variables

```env
# Whop
WHOP_API_KEY=
WHOP_APP_ID=
WHOP_CLIENT_ID=
WHOP_CLIENT_SECRET=
WHOP_WEBHOOK_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Resend
RESEND_API_KEY=

# Anthropic (for AI personalization — Growth+ tier)
ANTHROPIC_API_KEY=

# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# App
NEXT_PUBLIC_APP_URL=
```

---

## Database Schema

**IMPORTANT:** The `plan_tier` column includes all 5 tiers: free, starter, growth, pro, enterprise.

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
```

---

## Pricing Tiers & Feature Gates

```typescript
// src/lib/plan-limits.ts

export const PLAN_LIMITS = {
  free: {
    maxMembers: 50,
    playbooks: 0,           // Read-only dashboard. No outreach at all.
    manualEmails: 0,
    automatedOutreach: false,
    discordIntegration: false,
    telegramIntegration: false,
    aiPersonalization: false,
    abTesting: false,
    price: 0,
    label: 'Free',
  },
  starter: {
    maxMembers: 500,
    playbooks: 1,           // New Member Fast Start only
    manualEmails: Infinity,
    automatedOutreach: false, // Manual send only — no auto-sequences
    discordIntegration: true,
    telegramIntegration: false,
    aiPersonalization: false,
    abTesting: false,
    price: 49,
    label: 'Starter',
  },
  growth: {
    maxMembers: 2000,
    playbooks: 3,           // Silent Revival + Fast Start + Renewal Risk
    manualEmails: Infinity,
    automatedOutreach: true,
    discordIntegration: true,
    telegramIntegration: true,
    aiPersonalization: true,
    abTesting: true,
    price: 149,
    label: 'Growth',
  },
  pro: {
    maxMembers: Infinity,
    playbooks: Infinity,     // All system playbooks + custom builder
    manualEmails: Infinity,
    automatedOutreach: true,
    discordIntegration: true,
    telegramIntegration: true,
    aiPersonalization: true,
    abTesting: true,
    price: 299,
    label: 'Pro',
  },
  enterprise: {
    maxMembers: Infinity,
    playbooks: Infinity,
    manualEmails: Infinity,
    automatedOutreach: true,
    discordIntegration: true,
    telegramIntegration: true,
    aiPersonalization: true,
    abTesting: true,
    multiCommunity: true,
    whiteLabel: true,
    price: 999,
    label: 'Enterprise',
  },
} as const;

export type PlanTier = keyof typeof PLAN_LIMITS;

// Helper: check if a feature is available for a given tier
export function canAccess(tier: PlanTier, feature: keyof typeof PLAN_LIMITS['free']): boolean {
  return !!PLAN_LIMITS[tier][feature];
}

// Helper: get the next upgrade tier
export function getUpgradeTier(current: PlanTier): PlanTier | null {
  const order: PlanTier[] = ['free', 'starter', 'growth', 'pro', 'enterprise'];
  const idx = order.indexOf(current);
  return idx < order.length - 1 ? order[idx + 1] : null;
}
```

**Free tier is read-only:** Users see risk scores and the member list but CANNOT send emails, start playbooks, or take any action. Every screen should show an `<UpgradePrompt>` component when the user tries to interact with a gated feature.

---

## Risk Scoring Algorithm

This is the core engine. V1 works with Whop API data ONLY — no engagement data required.

```typescript
// src/lib/risk-scoring.ts

interface RiskFactor {
  factor: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  points: number;
  description: string;
}

interface RiskResult {
  score: number;         // 0-100
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  confidence: 'low' | 'medium' | 'high';
}

export function calculateChurnRisk(member: Member): RiskResult {
  let score = 0;
  const factors: RiskFactor[] = [];
  
  // 1. RENEWAL PROXIMITY + CANCELLATION (0-25 points)
  const daysUntilRenewal = member.days_until_renewal;
  if (daysUntilRenewal !== null && daysUntilRenewal <= 7 && daysUntilRenewal > 0) {
    score += 15;
    factors.push({
      factor: 'renewal_imminent',
      severity: 'high',
      points: 15,
      description: `Renewal in ${daysUntilRenewal} days`,
    });
  }
  
  if (member.cancel_at_period_end) {
    score += 10;
    factors.push({
      factor: 'cancellation_scheduled',
      severity: 'critical',
      points: 10,
      description: 'Cancellation scheduled at period end',
    });
  }
  
  // 2. PAYMENT FAILURES (0-25 points)
  if (member.recent_payment_failures > 0) {
    const pts = member.recent_payment_failures >= 2 ? 25 : 20;
    score += pts;
    factors.push({
      factor: 'payment_failure',
      severity: 'critical',
      points: pts,
      description: `${member.recent_payment_failures} failed payment(s) in last 30 days`,
    });
  }
  
  // 3. EARLY LIFECYCLE RISK (0-20 points)
  if (member.tenure_days < 14) {
    score += 10;
    factors.push({
      factor: 'new_member',
      severity: 'medium',
      points: 10,
      description: `Joined ${member.tenure_days} days ago — critical onboarding window`,
    });
    if (!member.has_engagement_data) {
      score += 10;
      factors.push({
        factor: 'no_engagement_visibility',
        severity: 'medium',
        points: 10,
        description: 'No engagement tracking — consider connecting Discord',
      });
    }
  }
  
  // 4. FIRST RENEWAL APPROACHING (0-15 points)
  if (member.tenure_days < 35 && daysUntilRenewal !== null && daysUntilRenewal <= 10) {
    score += 15;
    factors.push({
      factor: 'first_renewal',
      severity: 'high',
      points: 15,
      description: 'First renewal approaching — highest churn risk period',
    });
  }
  
  // 5. PREVIOUS CANCELLATIONS (0-10 points)
  if (member.previous_cancellations > 0) {
    score += 10;
    factors.push({
      factor: 'previous_cancellation',
      severity: 'medium',
      points: 10,
      description: `Previously cancelled ${member.previous_cancellations} time(s)`,
    });
  }
  
  // 6. ENGAGEMENT DATA — bonus points when Layer 2/3/4 connected (0-30 points)
  if (member.has_engagement_data && member.engagement_score !== undefined) {
    if (member.engagement_score < 15) {
      score += 20;
      factors.push({
        factor: 'very_low_engagement',
        severity: 'high',
        points: 20,
        description: 'Engagement significantly below community average',
      });
    } else if (member.engagement_score < 30) {
      score += 10;
      factors.push({
        factor: 'declining_engagement',
        severity: 'medium',
        points: 10,
        description: 'Engagement declining over recent weeks',
      });
    }
  }
  
  // Cap at 100
  score = Math.min(score, 100);
  
  // Determine level
  const level = score >= 70 ? 'critical'
    : score >= 40 ? 'high'
    : score >= 20 ? 'medium'
    : 'low';
  
  // Confidence based on data available
  const confidence = member.has_engagement_data ? 'high'
    : member.tenure_days > 30 ? 'medium'
    : 'low';
  
  return { score, level, factors, confidence };
}
```

---

## Whop iFrame Integration

This app renders INSIDE Whop's dashboard as an iFrame. Whop handles authentication.

```typescript
// src/lib/whop.ts
import { WhopServerSdk } from '@whop-apps/sdk';

export const whopApi = WhopServerSdk({
  apiKey: process.env.WHOP_API_KEY!,
  appId: process.env.WHOP_APP_ID!,
});

// In page components, get user/company context from Whop SDK.
// This replaces traditional auth — Whop handles it via the iFrame.
// Every API route should validate the Whop context.
```

**CRITICAL LAYOUT CONSTRAINT:** Since this renders in an iFrame inside Whop's dashboard which already has a sidebar, our app must NOT have a sidebar. Use a **sticky top navigation bar with tabs** (Dashboard, Playbooks, Analytics, Settings) as shown in the design reference.

---

## Channel-Agnostic Outreach

```typescript
// src/lib/outreach.ts
// Priority: email → whop_chat → discord_dm → telegram
// Email always works (Whop provides user emails)

async function sendToMember(
  member: Member,
  community: Community,
  content: { subject?: string; body: string },
  options?: { playbook_enrollment_id?: string }
): Promise<{ channel: string; success: boolean }> {
  const priority = community.settings.outreach_channel_priority;
  
  for (const channel of priority) {
    if (canReach(member, channel, community)) {
      try {
        await send(channel, member, content);
        await logOutreach({ member_id: member.id, channel, ...content, ...options });
        return { channel, success: true };
      } catch {
        continue; // Try next channel
      }
    }
  }
  return { channel: 'none', success: false };
}
```

---

## Background Jobs (Inngest)

```typescript
// 1. Recalculate risk scores — every 6 hours
// 2. Execute pending playbook steps — every 15 minutes
// 3. Sync Whop member data — every 4 hours
// 4. Daily digest email to creator — 8am
```

---

## Whop Webhook Events to Handle

```typescript
const HANDLED_EVENTS = [
  'membership.went_valid',      // New member or reactivation
  'membership.went_invalid',    // Cancelled or expired
  'membership.updated',         // Plan change, status change
  'payment.succeeded',          // Reset payment failure count
  'payment.failed',             // Increment failures, recalc risk
  'payment.refunded',           // Refund issued
];
```

---

## Email Templates (Starter+ Tier)

4 built-in templates with variable substitution:

| Template | Subject | Variables |
|----------|---------|-----------|
| Check-In | "Hey {firstName}, we miss you in {communityName}!" | firstName, communityName, creatorName |
| Renewal Reminder | "Your {communityName} membership renews soon" | firstName, communityName, planName, daysUntilRenewal, creatorName |
| Payment Recovery | "Action needed: update your payment for {communityName}" | firstName, communityName, paymentUpdateLink, creatorName |
| Welcome / Fast Start | "Welcome to {communityName}! Here's how to get started" | firstName, communityName, creatorName, onboardingStep1-3 |

---

## Important Implementation Notes

1. **Whop iFrame context:** Every request must validate the Whop user/company context from the SDK. Never trust client-side parameters alone.

2. **Free tier = read-only:** ALL action buttons (Send Email, Start Playbook, Connect Discord, etc.) should trigger an `<UpgradePrompt>` modal on the free tier. The dashboard shows risk scores and member list, but you can't DO anything.

3. **Email is always available:** Whop provides user emails via their API. Email is the default outreach channel — no integration setup needed.

4. **Discord DM rate limits:** When Discord integration is built, enforce: max 5 DMs/hour, 20/day per community. Never DM members who haven't interacted with the bot. Log every DM.

5. **All metrics come from real data:** Do NOT hardcode fake success rates or "revenue saved" numbers. Calculate from actual outreach_log and playbook_enrollments data. If no data yet, show "—" or "Collecting data..." not fabricated numbers.

6. **Risk score caching:** Scores are recalculated every 6 hours via Inngest cron job. Don't recalculate on every page load — read from the `risk_scores` table.

7. **Dark mode default:** Most Whop creators use dark mode. Default to dark. Persist preference in community settings JSONB.

8. **Mobile responsive:** The iFrame may render at various widths. Use 640px as the mobile breakpoint. Grid columns should collapse. The design reference handles this with `isMobile` checks.

---

## Design System

### Color Tokens

```
Primary/Accent:    #6e56ff (purple)
Critical/Danger:   #ff4757 (red)
High Risk:         #ffa502 (amber)
Medium Risk:       #3b82f6 (blue)
Low Risk/Success:  #2ed573 (green)

Dark backgrounds:  #09090b → #111114 → #16161a
Light backgrounds: #f8f8fa → #ffffff
Border (dark):     rgba(255,255,255,0.06)
Border (light):    rgba(0,0,0,0.07)
```

### Typography
- **Headings/Numbers:** Outfit (weight 700-900, letter-spacing -0.03em)
- **Body:** Plus Jakarta Sans (weight 400-700)
- **Data labels:** 11px uppercase, letter-spacing 0.05em, muted color

### Component Patterns
- **Cards:** 12px border-radius, 1px border, subtle shadow
- **Buttons:** 8px border-radius. Variants: default, primary (purple), ghost, danger, success, accent
- **Pills/Badges:** 6px border-radius, tinted bg + matching text color
- **Risk indicators:** Color-coded by level (critical=red, high=amber, medium=blue, low=green)
- **Stat blocks:** Muted uppercase label → large Outfit 800 number → optional subtitle
- **Progress bars:** 5px height, rounded, color by context
- **Engagement chart:** Vertical bar chart, 8 bars for weekly activity, recent bars highlighted

### Layout
- **Max width:** 1200px, centered
- **No sidebar** — top nav + tab bar only
- **Responsive:** grid columns collapse at <640px
- **Spacing:** 10-12px gaps between cards, 16-20px page padding
- **Animations:** Subtle fadeSlideIn on list items (staggered 30ms), fadeIn on screen transitions

---

## Design Reference (UI Prototype)

The file `design-reference/grip-prototype.tsx` is a **complete interactive React prototype** of the target UI. It includes all 6 screens with mock data and both dark/light themes.

### How to use the design reference:

1. **It is the visual truth** — match its layout, spacing, colors, typography, and component patterns exactly
2. **Prototype uses inline styles** → Production should use **Tailwind CSS** classes
3. **Prototype has hardcoded mock data** → Production fetches from API routes
4. **Prototype is a single 970-line file** → Production uses the component structure defined above
5. **Prototype's theme object** → Production should use Tailwind dark mode (`dark:` prefix) + CSS custom properties

### Screens in the prototype:

| Screen | Component | Key elements |
|--------|-----------|--------------|
| **Dashboard** | `<Dashboard>` | 4 stat blocks, data sources bar, risk filter buttons, member list table with risk score / renewal / LTV columns, action buttons per row |
| **Member Detail** | `<MemberDetail>` | Back button, avatar + name + risk score header, 2×2 grid: subscription card, risk factors card, engagement bar chart card, playbook history card. Action bar: Send Email, Whop Chat, Add Note, Start Playbook |
| **Playbooks** | `<PlaybooksScreen>` | 4 stat blocks (enrolled, revenue saved, manual work, ROI), playbook cards with emoji + name + step funnel bars + success rate, Pro upsell CTA |
| **Playbook Detail** | `<PlaybookDetail>` | Header with pause/config buttons, 4 stat blocks, step funnel with numbered steps + progress bars + sent counts, recent activity feed |
| **Analytics** | `<AnalyticsScreen>` | 4 stat blocks, risk distribution with progress bars, churn reasons breakdown, monthly impact 4-column grid |
| **Settings** | `<SettingsScreen>` | Integrations card (connected/not), outreach channel priority (draggable order), toggles (auto-enroll, daily digest), appearance toggle, current plan card with upgrade button |

### Navigation pattern:
- **Top nav:** Logo | Divider | Community name + member count | Spacer | Sync status | Theme toggle | Notifications bell
- **Tab bar:** Dashboard (with badge count) | Playbooks | Analytics | Settings
- **Drill-down:** Clicking a member row → Member Detail. Clicking a playbook card → Playbook Detail. Back button returns.

---

## Quick Start

```bash
npx create-next-app@latest grip --typescript --tailwind --app --src-dir
cd grip
npm install @whop-apps/sdk @supabase/supabase-js @upstash/redis resend inngest recharts
# Copy .env.local template, fill in keys
# Run Supabase migrations
# Register Whop app at https://dash.whop.com/developer
npm run dev
```

---

## Build Priority

Build in this order:

1. **Whop app shell** — iFrame renders, auth works, can read company/user context
2. **Member sync** — Fetch members from Whop API, store in DB, webhook listener
3. **Risk scoring** — Calculate scores, store in risk_scores table
4. **Dashboard UI** — Stats row, member list, filters (matches design reference)
5. **Member detail UI** — Subscription info, risk factors, engagement placeholder
6. **Email outreach** — Resend integration, templates, send from member detail
7. **Settings UI** — Integrations, preferences, plan display
8. **Analytics UI** — Risk distribution, churn stats, revenue impact
9. **Playbooks engine** — Step execution, enrollment, tracking (Growth tier)
10. **Playbooks UI** — Card view, detail view with funnel

---

## Full Product Plan

For complete business context, pricing strategy, go-to-market, competitive analysis, and revenue projections, see `complete_retention_app_plan_v2.md`.
