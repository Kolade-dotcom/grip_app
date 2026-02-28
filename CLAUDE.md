# CLAUDE.md — Grip: Retention Engine for Whop Communities

## What This Is

Grip is a Whop-native app that detects at-risk community members and executes automated retention playbooks to prevent cancellations. It renders inside a Whop creator's dashboard via iFrame.

**Core loop:** Whop API data → Risk scoring → Automated multi-step email/chat interventions → Track outcomes → Show ROI

**What we are NOT building:** A standalone SaaS dashboard. This is a Whop app that lives inside Whop's ecosystem.

---

## Tech Stack

```
Framework:      Next.js 15 (App Router) + TypeScript + React 19
Whop SDK:       @whop/react + @whop/sdk (iFrame integration, auth, API access)
Styling:        Tailwind CSS + custom design system
Charts:         Recharts
Database:       PostgreSQL via Supabase (@supabase/supabase-js)
Cache:          Redis via Upstash (@upstash/redis)
Jobs:           Inngest (background job scheduling)
Email:          Resend (sending + open/click tracking)
AI:             Anthropic Claude API (playbook message personalization)
Testing:        Vitest + @testing-library/react (TDD)
Hosting:        Vercel
Fonts:          Outfit (headings/numbers), Plus Jakarta Sans (body)
```

---

## Key Architecture Decisions

- **No sidebar** — renders in Whop's iFrame which has its own sidebar. Use sticky top nav + tab bar.
- **Whop handles auth** — user/company context comes from SDK, not custom auth.
- **Email-first outreach** — Whop provides emails. Priority: email → whop_chat → discord_dm → telegram.
- **Free tier = read-only** — show `<UpgradePrompt>` when free users try any action.
- **Risk scores cached** — recalculated every 6h via Inngest, read from `risk_scores` table.
- **Dark mode default** — persisted in community settings JSONB.
- **Mobile breakpoint: 640px** — grid columns collapse, checked via `isMobile`.
- **All metrics from real data** — never hardcode fake numbers. Show "—" if no data.

---

## Database Schema

Full schema in `supabase/migrations/001_initial_schema.sql`. Key tables:

| Table | Purpose |
|-------|---------|
| `communities` | Whop companies, integrations, plan_tier (free/starter/growth/pro/enterprise), settings JSONB |
| `members` | Synced from Whop API — subscription data, billing, platform IDs |
| `member_activity` | Engagement from Discord/Whop Chat/Telegram per date |
| `risk_scores` | One per member (UNIQUE), score 0-100, level, factors JSONB, confidence |
| `outreach_log` | All messages sent with delivery/open/click/respond tracking |
| `playbooks` | System + custom definitions, trigger conditions, steps JSONB |
| `playbook_enrollments` | Member-to-playbook junction, status tracking |
| `playbook_step_executions` | Scheduled step runs, indexed for pending queries |
| `events` | Audit log of webhook events |

---

## Pricing Tiers

5 tiers defined in `src/lib/plan-limits.ts`. Use `canAccess(tier, feature)` for gating.

| Tier | Price | Members | Playbooks | Key Gates |
|------|-------|---------|-----------|-----------|
| Free | $0 | 50 | 0 | Read-only dashboard, no outreach |
| Starter | $49 | 500 | 1 | Manual emails, Discord integration |
| Growth | $149 | 2,000 | 3 | Automated outreach, AI, A/B testing, Telegram |
| Pro | $299 | ∞ | ∞ | All system playbooks + custom builder |
| Enterprise | $999 | ∞ | ∞ | Multi-community, white-label |

---

## Risk Scoring

Implemented in `src/lib/risk-scoring.ts`. Scores 0-100 from 6 weighted factors:

1. **Renewal proximity** (0-15pts) + **Cancellation scheduled** (0-10pts)
2. **Payment failures** (0-25pts)
3. **Early lifecycle** (0-20pts): new member + no engagement visibility
4. **First renewal approaching** (0-15pts)
5. **Previous cancellations** (0-10pts)
6. **Low engagement** (0-30pts, requires Layer 2/3/4 data)

Levels: Critical (70-100), High (40-69), Medium (20-39), Low (0-19)

---

## Webhook Events

Handled in `src/app/api/whop/webhook/route.ts`:
`membership.went_valid`, `membership.went_invalid`, `membership.updated`, `payment.succeeded`, `payment.failed`, `payment.refunded`

## Background Jobs (Inngest)

1. Recalculate risk scores — every 6 hours
2. Execute pending playbook steps — every 15 minutes
3. Sync Whop member data — every 4 hours
4. Daily digest email to creator — 8am

## Email Templates

4 built-in templates in `src/lib/outreach.ts`: Check-In, Renewal Reminder, Payment Recovery, Welcome/Fast Start. Variables: `{firstName}`, `{communityName}`, `{creatorName}`, etc.

---

## Design System

**Colors:** Accent #6e56ff, Critical #ff4757, High #ffa502, Medium #3b82f6, Low #2ed573
**Dark bg:** #09090b → #111114 → #16161a | **Light bg:** #f8f8fa → #ffffff

**Components:** Cards (12px radius), Buttons (8px radius, 6 variants), Pills (6px radius), StatBlock (label → Outfit 800 number → sub), ProgressBar (5px), EngagementChart (8 vertical bars)

**Layout:** Max 1200px centered, 10-12px card gaps, 16-20px padding, fadeSlideIn animations (30ms stagger)

**Design reference:** `design-reference/grip-prototype.tsx` — visual truth for all 6 screens.

---

## Testing (TDD)

```bash
npm test              # Run all specs
npm run test:watch    # Watch mode
npm run test:coverage # V8 coverage
```

- Specs in `__tests__/` directories next to source: `*.spec.ts` (logic), `*.spec.tsx` (components)
- Config: `vitest.config.ts` (jsdom, React plugin, `@/` alias)
- Setup: `src/__tests__/setup.ts` (jest-dom matchers)
- Globals: `describe`, `it`, `expect`, `vi` available without imports

---

## Environment Variables

See `.env.local` template. Required: `WHOP_API_KEY`, `WHOP_APP_ID`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `UPSTASH_REDIS_REST_URL/TOKEN`, `INNGEST_EVENT_KEY/SIGNING_KEY`, `NEXT_PUBLIC_APP_URL`.

---

# Development Guidelines

## Before Coding

- **BP-1 (MUST)** Ask clarifying questions.
- **BP-2 (SHOULD)** Draft and confirm approach for complex work.
- **BP-3 (SHOULD)** If ≥ 2 approaches, list pros and cons.

## While Coding

- **C-1 (MUST)** Follow TDD: stub → failing test → implement.
- **C-2 (MUST)** Use existing domain vocabulary for naming.
- **C-3 (SHOULD NOT)** Introduce classes when functions suffice.
- **C-4 (SHOULD)** Prefer simple, composable, testable functions.
- **C-6 (MUST)** Use `import type { … }` for type-only imports.
- **C-7 (SHOULD NOT)** Add comments except for critical caveats.
- **C-8 (SHOULD)** Default to `type`; use `interface` only when merging needed.
- **C-9 (SHOULD NOT)** Extract functions unless reused, needed for testability, or dramatically improves readability.

## Testing Rules

- **T-1 (MUST)** Colocate unit tests in `__tests__/*.spec.ts` next to source.
- **T-3 (MUST)** Separate pure-logic unit tests from DB-touching integration tests.
- **T-4 (SHOULD)** Prefer integration tests over heavy mocking.
- **T-5 (SHOULD)** Unit-test complex algorithms thoroughly.
- **T-6 (SHOULD)** Test entire structure in one assertion when possible.

## Git

- **GH-1 (MUST)** Use Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `chore:`, etc.
- **GH-2 (SHOULD NOT)** Refer to Claude or Anthropic in commit messages.

---

## Function Quality Checklist

1. Is it easy to follow? If yes, stop.
2. High cyclomatic complexity? Probably needs simplification.
3. Unused parameters? Remove them.
4. Unnecessary type casts? Move to function arguments.
5. Easily testable without mocking? If not, use integration tests.
6. Hidden dependencies? Factor into arguments.
7. Is the name the best choice? Brainstorm 3 alternatives.

Do NOT extract separate functions unless: reused elsewhere, needed for testability, or original is extremely hard to follow.

## Test Quality Checklist

1. Parameterize inputs; no unexplained literals.
2. Every test must be able to fail for a real defect.
3. Test description must match what expect() verifies.
4. Compare to pre-computed expectations, not function output re-used as oracle.
5. Use strong assertions (`toEqual(1)` not `toBeGreaterThanOrEqual(1)`).
6. Test edge cases, realistic input, and boundaries.
7. Group under `describe(functionName, () => ...)`.

---

## Shortcuts

| Command | Action |
|---------|--------|
| **QNEW** | Re-read and follow all best practices |
| **QPLAN** | Verify plan is consistent with codebase, minimal changes, reuses existing code |
| **QCODE** | Implement plan, run tests, run prettier, run typecheck |
| **QCHECK** | Skeptical review: functions + tests + implementation checklists |
| **QCHECKF** | Skeptical review: functions checklist only |
| **QCHECKT** | Skeptical review: tests checklist only |
| **QUX** | List UX test scenarios sorted by priority |
| **QGIT** | Stage, commit (Conventional Commits), push |
