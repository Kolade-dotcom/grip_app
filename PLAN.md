# Grip — Implementation Plan

## Overview

This plan breaks the Grip retention app into 10 phases, ordered by dependency and the build priority from CLAUDE.md. Each phase lists the exact files to create, what they do, and acceptance criteria.

**Current state:** Specification docs + UI prototype only. No source code, no configuration, no dependencies.

---

## Phase 1: Project Scaffolding & Configuration

**Goal:** Initialize the Next.js 14+ App Router project with all dependencies, configuration files, and environment setup.

### Steps

1. **Initialize Next.js project** (in-place, since the repo already exists)
   - `package.json` — all dependencies listed in CLAUDE.md
   - `next.config.ts` — configure for Whop iFrame (headers, image domains)
   - `tsconfig.json` — strict TypeScript config
   - `tailwind.config.ts` — custom design system tokens (colors, fonts, spacing, border-radius from CLAUDE.md Design System section)
   - `postcss.config.js`
   - `.env.local` — template with all env vars from CLAUDE.md (empty values)

2. **Install dependencies**
   ```
   next, react, react-dom, typescript, @types/react, @types/node
   @whop-apps/sdk
   @supabase/supabase-js
   @upstash/redis
   resend
   inngest
   recharts
   tailwindcss, postcss, autoprefixer
   ```

3. **Global styles & fonts**
   - `src/app/globals.css` — Tailwind directives, CSS custom properties for theme colors, font-face declarations for Outfit + Plus Jakarta Sans
   - `src/app/layout.tsx` — Root layout with fonts, metadata, theme provider

4. **Database migration file**
   - `supabase/migrations/001_initial_schema.sql` — complete schema from CLAUDE.md

### Files Created
```
package.json
next.config.ts
tsconfig.json
tailwind.config.ts
postcss.config.js
.env.local
.gitignore
src/app/globals.css
src/app/layout.tsx
supabase/migrations/001_initial_schema.sql
```

### Acceptance Criteria
- `npm run dev` starts without errors
- Tailwind classes render correctly
- Fonts load (Outfit, Plus Jakarta Sans)
- Dark mode works via CSS custom properties

---

## Phase 2: Core Libraries & Type Definitions

**Goal:** Set up all client libraries, TypeScript types, and utility modules that everything else depends on.

### Steps

1. **TypeScript types** — Define all shared interfaces
   - `src/types/member.ts` — Member, MemberWithRisk, MemberActivity
   - `src/types/playbook.ts` — Playbook, PlaybookEnrollment, PlaybookStep, StepExecution
   - `src/types/risk.ts` — RiskScore, RiskFactor, RiskResult, RiskLevel
   - `src/types/community.ts` — Community, CommunitySettings, PlanTier

2. **Client libraries** — Initialize external service clients
   - `src/lib/whop.ts` — Whop SDK server client
   - `src/lib/supabase.ts` — Supabase server client + browser client factory
   - `src/lib/redis.ts` — Upstash Redis client
   - `src/lib/resend.ts` — Resend email client
   - `src/lib/ai.ts` — Anthropic Claude API client

3. **Business logic utilities**
   - `src/lib/plan-limits.ts` — PLAN_LIMITS constant, canAccess(), getUpgradeTier() (exact code from CLAUDE.md)
   - `src/lib/utils.ts` — Date formatting, currency formatting, pluralize, cn() class merge helper
   - `src/lib/risk-scoring.ts` — calculateChurnRisk() (exact algorithm from CLAUDE.md)

### Files Created
```
src/types/member.ts
src/types/playbook.ts
src/types/risk.ts
src/types/community.ts
src/lib/whop.ts
src/lib/supabase.ts
src/lib/redis.ts
src/lib/resend.ts
src/lib/ai.ts
src/lib/plan-limits.ts
src/lib/utils.ts
src/lib/risk-scoring.ts
```

### Acceptance Criteria
- All types compile without errors
- plan-limits canAccess() returns correct values for each tier
- risk-scoring returns correct score/level/factors for test inputs

---

## Phase 3: Whop App Shell & Authentication

**Goal:** The app renders inside Whop's iFrame, reads company/user context, and stores community records in the database.

### Steps

1. **App entry point**
   - `src/app/page.tsx` — Main entry: reads Whop iFrame context (company ID, user ID), creates/fetches community record in Supabase, redirects to dashboard

2. **Whop webhook handler**
   - `src/app/api/whop/webhook/route.ts` — POST handler that:
     - Validates webhook signature using WHOP_WEBHOOK_SECRET
     - Handles: membership.went_valid, membership.went_invalid, membership.updated, payment.succeeded, payment.failed, payment.refunded
     - Upserts member records and triggers risk recalculation on payment failures

3. **Community API** (implicit — handled in page.tsx and webhook)
   - On first load: create community row from Whop context
   - On webhook: look up community by whop_company_id

### Files Created
```
src/app/page.tsx
src/app/api/whop/webhook/route.ts
```

### Acceptance Criteria
- App loads inside a Whop iFrame without auth errors
- Community record is created in Supabase on first visit
- Webhooks are validated and member records are upserted

---

## Phase 4: Member Sync & Data Pipeline

**Goal:** Fetch members from Whop API, store in database, expose via API routes.

### Steps

1. **Sync logic**
   - `src/lib/sync.ts` — fetchAndSyncMembers(communityId): calls Whop API to list all memberships, upserts into members table, calculates tenure_days, updates community member_count

2. **Members API routes**
   - `src/app/api/members/route.ts` — GET: list members with risk scores joined, supports query params for risk_level filter, sort, search, pagination
   - `src/app/api/members/[id]/route.ts` — GET: single member with risk score, activity, outreach history. PUT: update member fields
   - `src/app/api/members/sync/route.ts` — POST: trigger manual sync for a community

3. **Risk recalculation API**
   - `src/app/api/risk/recalculate/route.ts` — POST: recalculate risk scores for all members in a community, write results to risk_scores table

4. **React hooks**
   - `src/hooks/useMembers.ts` — useMembers(filters) hook with SWR or fetch, returns members list + loading + error

### Files Created
```
src/lib/sync.ts
src/app/api/members/route.ts
src/app/api/members/[id]/route.ts
src/app/api/members/sync/route.ts
src/app/api/risk/recalculate/route.ts
src/hooks/useMembers.ts
```

### Acceptance Criteria
- POST /api/members/sync fetches from Whop API and populates members table
- GET /api/members returns paginated, filterable member list with risk scores
- Risk scores are written to risk_scores table after recalculation

---

## Phase 5: UI Primitives & Layout Components

**Goal:** Build all reusable UI components and the app layout shell, matching the design reference exactly.

### Steps

1. **UI Primitives** — Convert from prototype inline styles to Tailwind
   - `src/components/ui/Button.tsx` — Variants: default, primary, ghost, danger, success, accent. Sizes: sm, md, lg
   - `src/components/ui/Card.tsx` — 12px rounded, 1px border, optional hover state, optional header
   - `src/components/ui/StatBlock.tsx` — Label (uppercase 11px) → large number (Outfit 800) → optional subtitle/trend
   - `src/components/ui/RiskPill.tsx` — Color-coded pill: critical(red), high(amber), medium(blue), low(green)
   - `src/components/ui/ProgressBar.tsx` — 5px height, rounded, color prop
   - `src/components/ui/Toggle.tsx` — Switch toggle with label
   - `src/components/ui/Pill.tsx` — Generic badge/pill component
   - `src/components/ui/EngagementChart.tsx` — 8-bar vertical chart using Recharts

2. **Layout components**
   - `src/components/GripLogo.tsx` — Logo SVG/mark
   - `src/components/layout/TopNav.tsx` — Sticky top bar: logo, community name + member count, sync status indicator, theme toggle, notifications
   - `src/components/layout/TabBar.tsx` — Dashboard (with critical count badge) | Playbooks | Analytics | Settings tabs with active state
   - `src/components/layout/Footer.tsx` — Minimal footer

3. **Gating component**
   - `src/components/UpgradePrompt.tsx` — Modal/overlay shown when free tier users try gated features. Shows current tier, required tier, feature description, upgrade CTA

4. **Theme hook**
   - `src/hooks/useTheme.ts` — Dark/light mode toggle, persists to community settings, defaults to dark

### Files Created
```
src/components/ui/Button.tsx
src/components/ui/Card.tsx
src/components/ui/StatBlock.tsx
src/components/ui/RiskPill.tsx
src/components/ui/ProgressBar.tsx
src/components/ui/Toggle.tsx
src/components/ui/Pill.tsx
src/components/ui/EngagementChart.tsx
src/components/GripLogo.tsx
src/components/layout/TopNav.tsx
src/components/layout/TabBar.tsx
src/components/layout/Footer.tsx
src/components/UpgradePrompt.tsx
src/hooks/useTheme.ts
```

### Acceptance Criteria
- All components render in both dark and light mode
- Components match the design reference prototype pixel-for-pixel
- TopNav is sticky, TabBar highlights active tab
- UpgradePrompt blocks interaction and shows correct tier info
- Mobile responsive at 640px breakpoint

---

## Phase 6: Dashboard & Member Detail Screens

**Goal:** Build the two most important screens — the main dashboard and member detail view.

### Steps

1. **Dashboard components**
   - `src/components/dashboard/StatsRow.tsx` — 4 stat blocks: Revenue at Risk, Critical Members, Avg Risk Score, Members Tracked
   - `src/components/dashboard/DataSourcesBar.tsx` — Shows connected data sources (Whop API checkmark, Discord/Telegram status)
   - `src/components/dashboard/MemberFilters.tsx` — Filter buttons: All / Critical / High / Medium / Low with counts
   - `src/components/dashboard/MemberList.tsx` — Sortable table: avatar, name, risk score pill, subscription status, LTV, renewal date, action buttons (Send Email, View)

2. **Dashboard page**
   - `src/app/(screens)/dashboard/page.tsx` — Composes StatsRow + DataSourcesBar + MemberFilters + MemberList. Fetches from GET /api/members and GET /api/analytics

3. **Member detail components**
   - `src/components/members/MemberDetail.tsx` — Full layout: header (avatar, name, risk score, status), 2x2 card grid, action bar
   - `src/components/members/SubscriptionCard.tsx` — Plan name, price, billing period, status, tenure, LTV
   - `src/components/members/RiskFactorsCard.tsx` — List of risk factors with severity pills and descriptions
   - `src/components/members/EngagementCard.tsx` — 8-bar engagement chart (or "No data — connect Discord" placeholder)
   - `src/components/members/PlaybookHistoryCard.tsx` — List of playbook enrollments with status and dates

4. **Member detail page**
   - `src/app/(screens)/members/[id]/page.tsx` — Fetches member from GET /api/members/[id], renders MemberDetail

### Files Created
```
src/components/dashboard/StatsRow.tsx
src/components/dashboard/DataSourcesBar.tsx
src/components/dashboard/MemberFilters.tsx
src/components/dashboard/MemberList.tsx
src/app/(screens)/dashboard/page.tsx
src/components/members/MemberDetail.tsx
src/components/members/SubscriptionCard.tsx
src/components/members/RiskFactorsCard.tsx
src/components/members/EngagementCard.tsx
src/components/members/PlaybookHistoryCard.tsx
src/app/(screens)/members/[id]/page.tsx
```

### Acceptance Criteria
- Dashboard loads member list from API with real risk scores
- Filters work (clicking "Critical" shows only critical members)
- Member list is sortable by risk score, LTV, renewal date
- Clicking a member row navigates to member detail
- Member detail shows all 4 cards with real data
- Back button returns to dashboard
- Empty states shown when no data ("Collecting data..." not fake numbers)
- Free tier users see UpgradePrompt when clicking action buttons

---

## Phase 7: Email Outreach & Templates

**Goal:** Enable sending emails to members via Resend, with built-in templates and variable substitution.

### Steps

1. **Outreach engine**
   - `src/lib/outreach.ts` — sendToMember() with channel priority fallback (email → whop_chat → discord → telegram). Logs every attempt to outreach_log table

2. **Outreach API routes**
   - `src/app/api/outreach/route.ts` — POST: send email/message to a member. Validates tier access (Starter+ for manual email)
   - `src/app/api/outreach/templates/route.ts` — GET: return 4 built-in email templates (Check-In, Renewal Reminder, Payment Recovery, Welcome/Fast Start)

3. **Email sending flow** (from Member Detail action bar)
   - Click "Send Email" → template picker modal → variable substitution preview → send via Resend → log to outreach_log

### Files Created
```
src/lib/outreach.ts
src/app/api/outreach/route.ts
src/app/api/outreach/templates/route.ts
```

### Acceptance Criteria
- Emails send via Resend with correct template variables
- Outreach is logged in outreach_log with timestamps
- Free tier is blocked from sending (UpgradePrompt shown)
- Starter tier can send manual emails
- Channel fallback works if primary channel fails

---

## Phase 8: Settings & Analytics Screens

**Goal:** Build the settings page (integrations, preferences, plan display) and analytics page (risk distribution, churn data, revenue impact).

### Steps

1. **Settings page**
   - `src/app/(screens)/settings/page.tsx` — Sections:
     - Integrations card (Whop API always connected, Discord/Telegram connect buttons with tier gating)
     - Outreach channel priority (sortable list)
     - Toggles: auto-enroll playbooks, daily digest email
     - Appearance: dark/light mode toggle
     - Current plan card with tier info, member count/limit, upgrade CTA

2. **Analytics API**
   - `src/app/api/analytics/route.ts` — GET: aggregate data from risk_scores, outreach_log, playbook_enrollments. Returns: risk distribution counts, outreach stats, retention rate, revenue saved estimate

3. **Analytics hooks & page**
   - `src/hooks/useAnalytics.ts` — useAnalytics() hook
   - `src/app/(screens)/analytics/page.tsx` — 4 stat blocks (retention rate, revenue saved, emails sent, active playbooks), risk distribution progress bars, churn reasons breakdown, monthly impact grid

### Files Created
```
src/app/(screens)/settings/page.tsx
src/app/api/analytics/route.ts
src/hooks/useAnalytics.ts
src/app/(screens)/analytics/page.tsx
```

### Acceptance Criteria
- Settings page saves preferences to community settings JSONB
- Theme toggle persists and applies immediately
- Plan card shows correct tier info and member count
- Analytics page shows real aggregated data (or "Collecting data..." for new communities)
- Risk distribution shows progress bars matching actual member counts per risk level

---

## Phase 9: Playbook Engine & Background Jobs

**Goal:** Implement the automated playbook system and all Inngest background jobs.

### Steps

1. **Playbook engine**
   - `src/lib/playbook-engine.ts` — enrollMember(), executeStep(), checkTriggerConditions(), advancePlaybook(). Handles step scheduling, channel selection, content generation (with AI personalization for Growth+ tier)

2. **Playbook API routes**
   - `src/app/api/playbooks/route.ts` — GET: list playbooks for community, POST: create custom playbook (Pro+ tier)
   - `src/app/api/playbooks/[id]/route.ts` — GET/PUT/DELETE playbook
   - `src/app/api/playbooks/[id]/enroll/route.ts` — POST: manually enroll a member in a playbook
   - `src/app/api/playbooks/execute/route.ts` — POST: execute all pending playbook steps

3. **Inngest background jobs**
   - `src/inngest/client.ts` — Inngest client configuration
   - `src/inngest/functions/recalculate-risk.ts` — Cron every 6 hours: recalculate all risk scores
   - `src/inngest/functions/execute-playbook-steps.ts` — Cron every 15 minutes: find and execute pending steps
   - `src/inngest/functions/sync-whop-data.ts` — Cron every 4 hours: sync member data from Whop API
   - `src/inngest/functions/daily-digest.ts` — Cron 8am: send daily summary email to creator
   - `src/app/api/inngest/route.ts` — Inngest serve handler

4. **Playbook hooks**
   - `src/hooks/usePlaybooks.ts` — usePlaybooks() hook

### Files Created
```
src/lib/playbook-engine.ts
src/app/api/playbooks/route.ts
src/app/api/playbooks/[id]/route.ts
src/app/api/playbooks/[id]/enroll/route.ts
src/app/api/playbooks/execute/route.ts
src/inngest/client.ts
src/inngest/functions/recalculate-risk.ts
src/inngest/functions/execute-playbook-steps.ts
src/inngest/functions/sync-whop-data.ts
src/inngest/functions/daily-digest.ts
src/app/api/inngest/route.ts
src/hooks/usePlaybooks.ts
```

### Acceptance Criteria
- Members can be enrolled in playbooks via API
- Playbook steps execute on schedule (email sends, waits respected)
- Risk scores auto-recalculate every 6 hours
- Member data syncs every 4 hours from Whop
- Daily digest email is sent to creator at 8am
- Tier gating enforced: Growth+ for automated playbooks, Pro+ for custom playbooks
- AI personalization works for Growth+ tier messages

---

## Phase 10: Playbooks UI

**Goal:** Build the playbooks list screen and playbook detail screen.

### Steps

1. **Playbook components**
   - `src/components/playbooks/PlaybookCard.tsx` — Card with emoji, name, step count, enrolled/completed/success stats, funnel progress bars
   - `src/components/playbooks/PlaybookDetail.tsx` — Full detail: header with pause/config, 4 stat blocks, step funnel visualization, recent activity feed
   - `src/components/playbooks/StepFunnel.tsx` — Numbered steps with progress bars showing sent → opened → clicked → responded conversion

2. **Playbook pages**
   - `src/app/(screens)/playbooks/page.tsx` — 4 stat blocks (enrolled, revenue saved, manual work saved, ROI), grid of PlaybookCards, Pro upsell CTA at bottom
   - `src/app/(screens)/playbooks/[id]/page.tsx` — PlaybookDetail view, fetches from GET /api/playbooks/[id]

### Files Created
```
src/components/playbooks/PlaybookCard.tsx
src/components/playbooks/PlaybookDetail.tsx
src/components/playbooks/StepFunnel.tsx
src/app/(screens)/playbooks/page.tsx
src/app/(screens)/playbooks/[id]/page.tsx
```

### Acceptance Criteria
- Playbook list shows all playbooks with real stats
- Clicking a card navigates to detail view
- Step funnel shows conversion at each stage
- Activity feed shows recent enrollments and outcomes
- Free/Starter tier users see UpgradePrompt on playbook interactions
- "Build Custom Playbook" gated to Pro+ tier

---

## File Count Summary

| Phase | Files | Cumulative |
|-------|-------|------------|
| 1. Scaffolding | 10 | 10 |
| 2. Core Libs & Types | 12 | 22 |
| 3. Whop Shell & Auth | 2 | 24 |
| 4. Member Sync & APIs | 6 | 30 |
| 5. UI Primitives & Layout | 14 | 44 |
| 6. Dashboard & Member Detail | 11 | 55 |
| 7. Email Outreach | 3 | 58 |
| 8. Settings & Analytics | 4 | 62 |
| 9. Playbook Engine & Jobs | 12 | 74 |
| 10. Playbooks UI | 5 | 79 |

**Total: ~79 files**

---

## Dependency Graph

```
Phase 1 (Scaffolding)
  └── Phase 2 (Types + Libs)
        ├── Phase 3 (Whop Shell)
        │     └── Phase 4 (Member Sync)
        │           └── Phase 6 (Dashboard + Member Detail)
        │                 └── Phase 7 (Email Outreach)
        ├── Phase 5 (UI Primitives)
        │     └── Phase 6 (Dashboard + Member Detail)
        │     └── Phase 8 (Settings + Analytics)
        │     └── Phase 10 (Playbooks UI)
        └── Phase 9 (Playbook Engine + Jobs)
              └── Phase 10 (Playbooks UI)
```

Phases 5 and 3-4 can be worked on in parallel since they have no dependencies on each other. Similarly, Phase 8 and Phase 9 can be parallelized once Phase 5 and Phase 4 are complete.

---

## Key Design Decisions

1. **No sidebar** — Top nav + tab bar only (Whop iFrame constraint)
2. **Dark mode default** — `dark:` Tailwind prefix, CSS custom properties, persisted in community settings
3. **Server Components by default** — Only use `"use client"` for interactive components (filters, toggles, charts, modals)
4. **API routes validate Whop context** — Every route checks the Whop user/company from SDK, never trusts client params
5. **Real data only** — Show "—" or "Collecting data..." when no data exists, never fake numbers
6. **Progressive enhancement** — Free tier sees the dashboard (read-only), each tier unlocks more actions
7. **Email-first outreach** — Always available via Whop-provided emails, other channels are optional integrations
