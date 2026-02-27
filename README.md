# Grip — Retention Engine for Whop Communities

Grip is a Whop-native app that detects at-risk community members and executes automated retention playbooks to prevent cancellations. It renders inside a Whop creator's dashboard via iFrame.

**Core loop:** Whop API data → Risk scoring → Automated multi-step email/chat interventions → Track outcomes → Show ROI

## Tech Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Whop SDK:** @whop/react + @whop/sdk (iFrame integration, auth, API access)
- **Styling:** Tailwind CSS + custom design system
- **Charts:** Recharts
- **Database:** PostgreSQL via Supabase
- **Cache:** Redis via Upstash
- **Jobs:** Inngest (background job scheduling)
- **Email:** Resend
- **AI:** Anthropic Claude API (message personalization)
- **Hosting:** Vercel

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment template and fill in keys
cp .env.local.example .env.local

# Run database migrations against your Supabase instance
# (see supabase/migrations/001_initial_schema.sql)

# Start dev server
npm run dev
```

## Environment Variables

See `.env.local` for the full list. Key services to configure:

- **Whop** — `WHOP_API_KEY`, `NEXT_PUBLIC_WHOP_APP_ID`
- **Supabase** — `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Upstash Redis** — `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- **Resend** — `RESEND_API_KEY`
- **Inngest** — `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`

## Project Structure

```
src/
├── app/              # Next.js App Router pages & API routes
├── components/       # React components (ui/, layout/, dashboard/, etc.)
├── lib/              # Service clients & core logic
├── inngest/          # Background job definitions
├── hooks/            # React hooks
└── types/            # TypeScript type definitions
```

## Pricing Tiers

| Tier | Price | Members | Key Features |
|------|-------|---------|--------------|
| Free | $0 | 50 | Read-only dashboard, risk scores |
| Starter | $49 | 500 | 1 playbook, manual emails, Discord |
| Growth | $149 | 2,000 | 3 playbooks, automation, AI, A/B testing |
| Pro | $299 | Unlimited | Unlimited playbooks, custom builder |
| Enterprise | $999 | Unlimited | Multi-community, white-label |
